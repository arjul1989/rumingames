import { slugify } from "../cms"

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("strips accents and special characters", () => {
    expect(slugify("Guías de Esports 2026!")).toBe("guias-de-esports-2026")
  })

  it("trims leading/trailing separators", () => {
    expect(slugify("  --Nuevo--  ")).toBe("nuevo")
  })
})
