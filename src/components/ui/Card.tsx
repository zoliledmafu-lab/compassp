import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, className = '', onClick, hover }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`glass rounded-2xl p-5 ${hover ? 'hover:border-indigo-500/40 hover:bg-white/8 transition-all duration-200 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
