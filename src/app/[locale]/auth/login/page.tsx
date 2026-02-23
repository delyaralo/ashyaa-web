"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Step = "phone" | "otp";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { login, isLoggedIn } = useAuth();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+964");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, router]);

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: () => authApi.sendOtp(phone),
    onSuccess: () => {
      setStep("otp");
      setError("");
      // Focus the first OTP input
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    },
    onError: () => {
      setError("Failed to send code. Check your phone number.");
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: () => authApi.verifyOtp(phone, otp.join("")),
    onSuccess: (res) => {
      login(res.data.token, res.data.user);
      router.push("/");
    },
    onError: () => {
      setError("Invalid code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    },
  });

  const handleSendOtp = () => {
    if (phone.length < 8) {
      setError("Enter a valid phone number");
      return;
    }
    setError("");
    sendOtpMutation.mutate();
  };

  const handleVerifyOtp = () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits");
      return;
    }
    setError("");
    verifyOtpMutation.mutate();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (value && index === 5) {
      const code = newOtp.join("");
      if (code.length === 6) {
        setTimeout(() => verifyOtpMutation.mutate(), 100);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || "";
      }
      setOtp(newOtp);
      const focusIndex = Math.min(pastedData.length, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">
            {tCommon("appName")}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {step === "phone" ? t("phoneLabel") : t("otpSent")}
          </p>
        </div>

        {step === "phone" ? (
          /* Phone Number Step */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                {t("phoneLabel")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendOtp();
                }}
                placeholder={t("phonePlaceholder")}
                className="w-full h-14 px-4 rounded-xl bg-gray-50 border border-gray-200 text-lg text-center font-mono tracking-wider outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                dir="ltr"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-error text-center">{error}</p>
            )}

            <button
              onClick={handleSendOtp}
              disabled={sendOtpMutation.isPending || phone.length < 8}
              className="w-full h-14 bg-primary text-white text-lg font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendOtpMutation.isPending ? tCommon("loading") : t("sendOtp")}
            </button>
          </div>
        ) : (
          /* OTP Step */
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark mb-3 text-center">
                {t("otpLabel")}
              </label>
              <div className="flex justify-center gap-3" dir="ltr">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-14 rounded-xl bg-gray-50 border border-gray-200 text-xl text-center font-bold outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-error text-center">{error}</p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={verifyOtpMutation.isPending || otp.join("").length !== 6}
              className="w-full h-14 bg-primary text-white text-lg font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifyOtpMutation.isPending ? tCommon("loading") : t("verify")}
            </button>

            {/* Resend */}
            <button
              onClick={() => {
                setStep("phone");
                setOtp(["", "", "", "", "", ""]);
                setError("");
              }}
              className="w-full text-sm text-gray-500 hover:text-primary transition-colors"
            >
              {tCommon("back")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
