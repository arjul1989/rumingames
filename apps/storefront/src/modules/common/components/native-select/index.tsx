import { ChevronUpDown } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import {
  SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

export type NativeSelectProps = {
  placeholder?: string
  label?: string
  required?: boolean
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
} & SelectHTMLAttributes<HTMLSelectElement>

const fieldShellClass =
  "relative flex items-center w-full h-11 border border-ui-border-base bg-ui-bg-field rounded-md hover:bg-ui-bg-field-hover focus-within:shadow-borders-interactive-with-active"

const selectClass =
  "appearance-none flex-1 h-full bg-transparent border-none px-4 pt-4 pb-1 text-on-surface transition-colors duration-150 outline-none"

const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    {
      placeholder = "Select...",
      label,
      required,
      defaultValue,
      className,
      children,
      value,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLSelectElement>(null)
    const [isPlaceholder, setIsPlaceholder] = useState(false)

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    useEffect(() => {
      const current = innerRef.current?.value ?? ""
      setIsPlaceholder(!current)
    }, [value, defaultValue])

    const selectControl = (
      <div
        onFocus={() => innerRef.current?.focus()}
        onBlur={() => innerRef.current?.blur()}
        className={clx(fieldShellClass, className, {
          "text-ui-fg-muted": isPlaceholder && !label,
        })}
      >
        <select
          ref={innerRef}
          defaultValue={defaultValue}
          value={value}
          {...props}
          className={clx(selectClass, label && "pt-4")}
        >
          {!label && (
            <option disabled value="">
              {placeholder}
            </option>
          )}
          {children}
        </select>
        {label && (
          <label
            htmlFor={props.id ?? props.name}
            className="pointer-events-none absolute left-4 top-1 text-xsmall-regular text-ui-fg-subtle"
          >
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <span className="absolute right-4 inset-y-0 flex items-center pointer-events-none text-on-surface-variant">
          <ChevronUpDown />
        </span>
      </div>
    )

    if (label) {
      return <div className="flex flex-col w-full txt-compact-medium">{selectControl}</div>
    }

    return (
      <div>
        {selectControl}
      </div>
    )
  }
)

NativeSelect.displayName = "NativeSelect"

export default NativeSelect
