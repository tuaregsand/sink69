import React from 'react';
import './globals.css'
import { Inter } from 'next/font/google'
import WalletContextProvider from '../components/WalletContextProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Solana Options DEX',
  description: 'Decentralized Options Trading on Solana',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-dark-bg text-white min-h-screen`}>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  )
} 