"use client"

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react"

// Revela o conteudo ao entrar na viewport (IntersectionObserver), sem
// nenhuma lib externa. Mantemos tudo CSS: aplicamos a classe .reveal
// (opacity:0) e, quando o elemento aparece, adicionamos .is-visible que
// dispara a keyframe fade-in-up (definida no globals.css / tailwind).
//
// Acessibilidade + robustez:
//  - prefers-reduced-motion: o CSS ja neutraliza (.reveal vira opacity:1).
//  - Sem JS / sem IntersectionObserver: o <noscript> abaixo forca a
//    visibilidade, entao o conteudo nunca fica preso invisivel.
//  - O atributo `as` permite escolher a tag (section, div, li...).
type Tag = "div" | "section" | "li" | "article"

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  as = "div",
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: Tag
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Sem suporte: revela imediatamente.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const Tag = as as ElementType

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
