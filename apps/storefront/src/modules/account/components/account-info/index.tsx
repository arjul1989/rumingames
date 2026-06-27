import { Disclosure } from "@headlessui/react"
import { accountLabels } from "@lib/i18n/es-co"
import { Badge, Button, clx } from "@modules/common/components/ui"
import { useEffect, useRef } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { useFormStatus } from "react-dom"

function AccountInfoFormActions({
  onCancel,
}: {
  onCancel: () => void
}) {
  const { pending } = useFormStatus()

  return (
    <div className="mt-2 flex flex-col-reverse gap-2 small:flex-row small:items-center small:justify-end">
      <Button
        type="reset"
        variant="secondary"
        className="w-full small:max-w-[140px]"
        onClick={onCancel}
        data-testid="cancel-button"
      >
        {accountLabels.cancel}
      </Button>
      <Button
        isLoading={pending}
        className="brutalist-button w-full small:max-w-[160px] bg-primary px-4 py-2.5 font-semibold text-on-primary shadow-[0_0_20px_rgba(221,183,255,0.35)] transition-opacity hover:opacity-90"
        type="submit"
        data-testid="save-button"
      >
        {accountLabels.saveChanges}
      </Button>
    </div>
  )
}

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  "data-testid"?: string
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = accountLabels.errorRetry,
  children,
  "data-testid": dataTestid,
}: AccountInfoProps) => {
  const { state, open, close } = useToggleState()
  const prevSuccessRef = useRef(false)

  const handleOpen = () => {
    clearState()
    open()
  }

  const handleCancel = () => {
    clearState()
    close()
  }

  // Close the editor only when a save just succeeded, not while opening edit.
  useEffect(() => {
    if (isSuccess && !prevSuccessRef.current) {
      close()
    }
    prevSuccessRef.current = !!isSuccess
  }, [isSuccess, close])

  // Hide stale success badges after a few seconds.
  useEffect(() => {
    if (!isSuccess || state) {
      return
    }

    const timer = window.setTimeout(() => {
      clearState()
    }, 3500)

    return () => window.clearTimeout(timer)
  }, [isSuccess, state, clearState])

  const showSuccess = !!isSuccess && !state

  return (
    <div className="text-small-regular" data-testid={dataTestid}>
      <div className="flex items-start justify-between gap-x-4">
        <div className="flex min-w-0 flex-1 flex-col gap-y-1">
          <span className="font-mono text-xs uppercase tracking-widest text-on-surface-variant/60">
            {label}
          </span>
          {typeof currentInfo === "string" ? (
            <span
              className="font-semibold break-all text-left"
              data-testid="current-info"
            >
              {currentInfo}
            </span>
          ) : (
            currentInfo
          )}
        </div>
        {!state && (
          <div className="shrink-0">
            <Button
              variant="secondary"
              className="w-[100px] min-h-[25px] py-1"
              onClick={handleOpen}
              type="button"
              data-testid="edit-button"
            >
              {accountLabels.edit}
            </Button>
          </div>
        )}
      </div>

      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": showSuccess,
              "max-h-0 opacity-0 pointer-events-none": !showSuccess,
            }
          )}
          data-testid="success-message"
        >
          <Badge className="p-2 my-4" color="green">
            <span>{accountLabels.updatedOk(label)}</span>
          </Badge>
        </Disclosure.Panel>
      </Disclosure>

      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isError && !state,
              "max-h-0 opacity-0 pointer-events-none": !isError || state,
            }
          )}
          data-testid="error-message"
        >
          <Badge className="p-2 my-4" color="red">
            <span>{errorMessage}</span>
          </Badge>
        </Disclosure.Panel>
      </Disclosure>

      <Disclosure>
        <Disclosure.Panel
          static
          hidden={!state}
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100 pointer-events-auto": state,
              "max-h-0 opacity-0 pointer-events-none": !state,
            }
          )}
        >
          <div className="flex flex-col gap-y-2 py-4">
            <div>{children}</div>
            <AccountInfoFormActions onCancel={handleCancel} />
          </div>
        </Disclosure.Panel>
      </Disclosure>
    </div>
  )
}

export default AccountInfo
