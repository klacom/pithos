"use client"

type Props = {
    title?: string
    placeholder?: string
    boxWidth?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    type?: string
    disabled?: boolean
    readOnly?: boolean
}

const TitleInputForm = ({
    title,
    placeholder,
    boxWidth,
    value,
    onChange,
    type = "text",
    disabled = false,
    readOnly
}: Props) => {
    return (
        // ${ boxWidth ?? "w-[300px]" }
        <div className='flex flex-col gap-2 w-full'>
            <label className='font-medium'>{title}</label>

            <input
                readOnly={readOnly}
                type={type}
                placeholder={placeholder}
                value={value ?? ""}
                onChange={onChange}
                disabled={disabled}
                className={`
          border border-muted
          outline-none
          focus:border-foreground
          focus:ring-1 focus:ring-foreground
          w-full
          bg-primary-foreground
          px-2 py-1.5
          rounded-md
          transition
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-foreground"}
        `}
            />
        </div>
    )
}

export default TitleInputForm