import { orderLabels } from "@lib/i18n/es-co"
import { Heading } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

const Help = () => {
  return (
    <div className="mt-6">
      <Heading className="text-base-semi">{orderLabels.needHelp}</Heading>
      <div className="text-base-regular my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <LocalizedClientLink href="/contacto">
              {orderLabels.contact}
            </LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/contacto">
              {orderLabels.returns}
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
