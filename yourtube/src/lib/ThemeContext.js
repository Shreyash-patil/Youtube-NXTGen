import { createContext, useContext, useState, useEffect, useCallback } from "react";

const SOUTH_INDIAN_STATES = [
  "tamil nadu",
  "kerala",
  "karnataka",
  "andhra pradesh",
  "telangana",
];

const ThemeContext = createContext();

/**
 * Determines whether we should use the light theme.
 * Light theme ONLY when:
 *   - Time is between 10:00 AM and 12:00 PM IST
 *   - User location is in a South Indian state
 * Otherwise, dark theme is applied.
 */
function shouldUseLightTheme(userState) {
  // Get the current time in IST
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utcMs + 5.5 * 60 * 60 * 1000);
  const istHour = istDate.getHours();
  const istMinute = istDate.getMinutes();

  const isWithinTimeRange =
    (istHour === 10 || istHour === 11 || (istHour === 12 && istMinute === 0));

  const isSouthIndia =
    userState &&
    SOUTH_INDIAN_STATES.includes(userState.toLowerCase().trim());

  return isWithinTimeRange && isSouthIndia;
}

/**
 * Check if the user's detected state is a South Indian state.
 */
export function isSouthIndianState(stateName) {
  if (!stateName) return false;
  return SOUTH_INDIAN_STATES.includes(stateName.toLowerCase().trim());
}

/**
 * Fetch user's location (state) using a free IP geolocation API.
 */
async function fetchUserLocation() {
  try {
    // Try ipapi.co first
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
    console.warn("Primary geolocation failed, trying fallback:", e.message);
  }

  try {
    // Fallback to ip-api.com
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
    console.warn("Fallback geolocation also failed:", e.message);
  }

  return { state: "", country: "", city: "" };
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("dark"); // default dark
  const [userLocation, setUserLocation] = useState({
    state: "",
    country: "",
    city: "",
  });
  const [locationLoaded, setLocationLoaded] = useState(false);

  // Fetch location on mount
  useEffect(() => {
    let cancelled = false;

    fetchUserLocation().then((loc) => {
      if (!cancelled) {
        setUserLocation(loc);
        setLocationLoaded(true);

        // Determine theme based on location + time
        const useLight = shouldUseLightTheme(loc.state);
        setTheme(useLight ? "light" : "dark");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Re-check theme every minute (in case time crosses boundary)
  useEffect(() => {
    if (!locationLoaded) return;

    const interval = setInterval(() => {
      const useLight = shouldUseLightTheme(userLocation.state);
      setTheme(useLight ? "light" : "dark");
    }, 60000);

    return () => clearInterval(interval);
  }, [locationLoaded, userLocation.state]);

  // Apply theme class to documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const value = {
    theme,
    userLocation,
    locationLoaded,
    isSouthIndia: isSouthIndianState(userLocation.state),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
