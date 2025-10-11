import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function OTPInput({ value, onChange }: OTPInputProps) {
  return (
    <InputOTP maxLength={6} value={value} onChange={onChange} data-testid="input-otp">
      <InputOTPGroup>
        <InputOTPSlot index={0} className="text-2xl font-mono h-14 w-12" />
        <InputOTPSlot index={1} className="text-2xl font-mono h-14 w-12" />
        <InputOTPSlot index={2} className="text-2xl font-mono h-14 w-12" />
        <InputOTPSlot index={3} className="text-2xl font-mono h-14 w-12" />
        <InputOTPSlot index={4} className="text-2xl font-mono h-14 w-12" />
        <InputOTPSlot index={5} className="text-2xl font-mono h-14 w-12" />
      </InputOTPGroup>
    </InputOTP>
  );
}
