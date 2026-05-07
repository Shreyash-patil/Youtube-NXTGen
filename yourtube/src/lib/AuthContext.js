import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState, useCallback } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext, createContext } from "react";

const SOUTH_INDIAN_STATES = [
  "tamil nadu",
  "kerala",
  "karnataka",
  "andhra pradesh",
  "telangana",
];

function isSouthIndianState(stateName) {
  if (!stateName) return false;
  return SOUTH_INDIAN_STATES.includes(stateName.toLowerCase().trim());
}

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // OTP verification flow state
  const [otpPending, setOtpPending] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [userLocation, setUserLocation] = useState({ state: "", country: "", city: "" });
  // Phone number collection step (for non-south users)
  const [needsPhone, setNeedsPhone] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const login = useCallback((userdata) => {
    setUser(userdata);
    localStorage.setItem("user", JSON.stringify(userdata));
    // Clear OTP state
    setOtpPending(false);
    setOtpData(null);
    setOtpError("");
    setNeedsPhone(false);
    setPendingPayload(null);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem("user");
    setOtpPending(false);
    setOtpData(null);
    setOtpError("");
    setNeedsPhone(false);
    setPendingPayload(null);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  }, []);

  const cancelOtp = useCallback(() => {
    setOtpPending(false);
    setOtpData(null);
    setOtpError("");
    setNeedsPhone(false);
    setPendingPayload(null);
    // Also sign out of firebase since we started the process
    signOut(auth).catch(() => {});
  }, []);

  /**
   * Fetch user location via IP geolocation
   */
  const fetchLocation = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/", {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          state: data.region || "",
          country: data.country_name || "",
          city: data.city || "",
        };
      }
    } catch (e) {
      console.warn("Primary geolocation failed:", e.message);
    }

    try {
      const response = await fetch("http://ip-api.com/json/?fields=status,regionName,country,city", {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          return {
            state: data.regionName || "",
            country: data.country || "",
            city: data.city || "",
          };
        }
      }
    } catch (e) {
      console.warn("Fallback geolocation failed:", e.message);
    }

    return { state: "", country: "", city: "" };
  };

  /**
   * Google Sign-In → triggers OTP flow based on location
   */
  const handlegooglesignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseuser = result.user;

      // Get user location
      const location = await fetchLocation();
      setUserLocation(location);

      const payload = {
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image: firebaseuser.photoURL || "https://github.com/shadcn.png",
        state: location.state,
      };

      // Request OTP
      setOtpLoading(true);
      setOtpError("");
      try {
        const otpResponse = await axiosInstance.post("/otp/send", payload);
        const otpResult = otpResponse.data;

        // Server says we need a phone number first (non-south user)
        if (otpResult.needsPhone) {
          setNeedsPhone(true);
          setPendingPayload(payload);
          setOtpData({
            email: firebaseuser.email,
            name: firebaseuser.displayName,
            image: firebaseuser.photoURL || "https://github.com/shadcn.png",
            method: "sms",
            target: "",
            state: location.state,
            isSouthIndia: false,
          });
          setOtpPending(true);
          return;
        }

        setOtpData({
          email: firebaseuser.email,
          name: firebaseuser.displayName,
          image: firebaseuser.photoURL || "https://github.com/shadcn.png",
          method: otpResult.method,
          target: otpResult.target,
          state: location.state,
          isSouthIndia: otpResult.isSouthIndia,
        });
        setNeedsPhone(false);
        setOtpPending(true);
      } catch (err) {
        console.error("OTP send failed:", err);
        setOtpError("Failed to send OTP. Please try again.");
        // Fallback: direct login without OTP
        try {
          const response = await axiosInstance.post("/user/login", payload);
          login(response.data.result);
        } catch (loginErr) {
          console.error("Fallback login also failed:", loginErr);
        }
      } finally {
        setOtpLoading(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Submit phone number for SMS OTP (non-south users)
   */
  const submitPhone = async (phoneNumber) => {
    if (!pendingPayload) return;

    setOtpLoading(true);
    setOtpError("");
    try {
      const payload = { ...pendingPayload, phone: phoneNumber };
      const otpResponse = await axiosInstance.post("/otp/send", payload);
      const otpResult = otpResponse.data;

      setOtpData((prev) => ({
        ...prev,
        method: otpResult.method,
        target: otpResult.target,
        phone: phoneNumber,
      }));
      setNeedsPhone(false);
      setPendingPayload(null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send SMS OTP. Please try again.";
      setOtpError(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  /**
   * Verify the OTP entered by the user
   */
  const verifyOtp = async (otpCode) => {
    if (!otpData) return;

    setOtpLoading(true);
    setOtpError("");
    try {
      const response = await axiosInstance.post("/otp/verify", {
        email: otpData.email,
        otp: otpCode,
      });
      login(response.data.result);
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid OTP. Please try again.";
      setOtpError(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const resendOtp = async () => {
    if (!otpData) return;

    setOtpLoading(true);
    setOtpError("");
    try {
      const response = await axiosInstance.post("/otp/send", {
        email: otpData.email,
        name: otpData.name,
        image: otpData.image,
        state: otpData.state,
        phone: otpData.phone || "",
      });
      setOtpData((prev) => ({
        ...prev,
        method: response.data.method,
        target: response.data.target,
      }));
      setOtpError(""); // clear any previous error
    } catch (err) {
      setOtpError("Failed to resend OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (firebaseuser) {
        // Check if we have a stored user already (skip OTP on page reload)
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
          } catch (e) {
            // If stored user is invalid, re-login
            try {
              const payload = {
                email: firebaseuser.email,
                name: firebaseuser.displayName,
                image: firebaseuser.photoURL || "https://github.com/shadcn.png",
              };
              const response = await axiosInstance.post("/user/login", payload);
              login(response.data.result);
            } catch (error) {
              console.error(error);
              logout();
            }
          }
        }
        // If no stored user and no OTP pending, don't auto-login (wait for OTP flow)
      }
    });
    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        handlegooglesignin,
        // OTP-related
        otpPending,
        otpData,
        otpError,
        otpLoading,
        verifyOtp,
        resendOtp,
        cancelOtp,
        submitPhone,
        needsPhone,
        userLocation,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
