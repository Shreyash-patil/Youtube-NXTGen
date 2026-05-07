import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";

const OTPVerificationModal = () => {
  const {
    otpPending,
    otpData,
    otpError,
    otpLoading,
    verifyOtp,
    resendOtp,
    cancelOtp,
    submitPhone,
    needsPhone,
  } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Countdown for resend
  useEffect(() => {
    if (!otpPending || needsPhone) return;
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpPending, needsPhone]);

  // Focus first OTP input when phone step completes
  useEffect(() => {
    if (otpPending && !needsPhone && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [otpPending, needsPhone]);

  // Focus phone input when phone step opens
  useEffect(() => {
    if (otpPending && needsPhone && phoneRef.current) {
      setTimeout(() => phoneRef.current?.focus(), 100);
    }
  }, [otpPending, needsPhone]);

  if (!otpPending || !otpData) return null;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.every((d) => d !== "")) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || "";
      }
      setOtp(newOtp);
      if (pasted.length === 6) {
        verifyOtp(pasted);
      } else {
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      }
    }
  };

  const handleResend = async () => {
    setOtp(["", "", "", "", "", ""]);
    setResendTimer(30);
    await resendOtp();
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length === 6) {
      verifyOtp(code);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneInput.replace(/\D/g, "");
    // Accept 10-digit Indian number or with country code
    const digits = cleaned.replace(/^(91)/, "");
    if (digits.length !== 10) {
      setPhoneError("Please enter a valid 10-digit mobile number");
      return;
    }
    setPhoneError("");
    submitPhone(digits);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
          isDark
            ? "bg-[#1a1a2e] border border-white/10"
            : "bg-white border border-gray-200"
        }`}
      >
        {/* Header gradient */}
        <div
          className="px-8 pt-8 pb-6 text-center"
          style={{
            background: isDark
              ? "linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)"
              : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {needsPhone ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              )}
            </svg>
          </div>
          <h2
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {needsPhone ? "Enter Your Mobile Number" : "Verify Your Identity"}
          </h2>
          <p
            className={`mt-2 text-sm ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {needsPhone
              ? "We'll send a 6-digit OTP to your mobile number"
              : otpData.method === "email"
              ? `We've sent a 6-digit OTP to your email`
              : `We've sent a 6-digit OTP to your mobile`}
          </p>
          {!needsPhone && (
            <p
              className={`mt-1 text-sm font-semibold ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              {otpData.target}
            </p>
          )}
        </div>

        {/* Region badge */}
        <div className="flex justify-center -mt-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
              otpData.isSouthIndia
                ? isDark
                  ? "bg-green-900/50 text-green-300 border border-green-700"
                  : "bg-green-100 text-green-700 border border-green-200"
                : isDark
                ? "bg-orange-900/50 text-orange-300 border border-orange-700"
                : "bg-orange-100 text-orange-700 border border-orange-200"
            }`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            {otpData.isSouthIndia
              ? `South India • Email OTP`
              : `${otpData.state || "Other Region"} • Mobile OTP`}
          </span>
        </div>

        {/* Phone Number Input Step */}
        {needsPhone ? (
          <form onSubmit={handlePhoneSubmit} className="px-8 py-6">
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-1.5 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <div
                    className={`flex items-center px-3 rounded-xl border-2 text-sm font-medium ${
                      isDark
                        ? "bg-white/5 border-white/20 text-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-500"
                    }`}
                  >
                    +91
                  </div>
                  <input
                    ref={phoneRef}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phoneInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPhoneInput(val);
                      setPhoneError("");
                    }}
                    placeholder="Enter 10-digit number"
                    className={`flex-1 px-4 py-3 rounded-xl border-2 outline-none transition-all duration-200 text-base ${
                      isDark
                        ? "bg-white/5 border-white/20 text-white focus:border-blue-500 focus:bg-white/10 placeholder:text-gray-600"
                        : "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:bg-blue-50 placeholder:text-gray-400"
                    } ${phoneError ? (isDark ? "border-red-500/60" : "border-red-400") : ""}`}
                    disabled={otpLoading}
                  />
                </div>
                {phoneError && (
                  <p className="text-sm text-red-500 mt-1.5">{phoneError}</p>
                )}
              </div>
            </div>

            {otpError && (
              <div className="mt-3 text-center">
                <p className="text-sm text-red-500 font-medium">{otpError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={otpLoading || phoneInput.length < 10}
              className={`mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                otpLoading || phoneInput.length < 10
                  ? isDark
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              }`}
            >
              {otpLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                "Send OTP to Mobile"
              )}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={cancelOtp}
                className={`text-sm ${
                  isDark
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* OTP Input Step */
          <form onSubmit={handleSubmit} className="px-8 py-6">
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200 ${
                    isDark
                      ? "bg-white/5 border-white/20 text-white focus:border-blue-500 focus:bg-white/10"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500 focus:bg-blue-50"
                  } ${digit ? (isDark ? "border-blue-500/60" : "border-blue-400") : ""}`}
                  disabled={otpLoading}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            {/* Error message */}
            {otpError && (
              <div className="mt-4 text-center">
                <p className="text-sm text-red-500 font-medium">{otpError}</p>
              </div>
            )}

            {/* Verify button */}
            <button
              type="submit"
              disabled={otpLoading || otp.some((d) => d === "")}
              className={`mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                otpLoading || otp.some((d) => d === "")
                  ? isDark
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              }`}
            >
              {otpLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify OTP"
              )}
            </button>

            {/* Resend & Cancel */}
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimer > 0 || otpLoading}
                className={`text-sm transition-colors ${
                  resendTimer > 0 || otpLoading
                    ? isDark
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 cursor-not-allowed"
                    : isDark
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
              <button
                type="button"
                onClick={cancelOtp}
                className={`text-sm ${
                  isDark
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OTPVerificationModal;
