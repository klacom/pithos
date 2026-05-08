import { sanitizeText } from "@/lib/sanitization";

interface InputTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

const InputTextField = ({ placeholder, className, onChange, ...props }: InputTextFieldProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize text inputs to prevent XSS
    if (e.target.type === "text" || e.target.type === "email" || !e.target.type) {
      e.target.value = sanitizeText(e.target.value);
    }
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <input
      type="text"
      placeholder={placeholder}
      className={`border-muted outline-none focus:border-foreground focus:ring-foreground h-full w-[400px] hover:border hover:border-foreground bg-primary-foreground px-5 py-2 rounded-md ${className}`}
      onChange={handleChange}
      {...props}
    />
  );
};

export default InputTextField;
