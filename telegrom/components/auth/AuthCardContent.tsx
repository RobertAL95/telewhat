// /components/Auth/AuthCardContent.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, Box } from '@mui/material'
import dynamic from 'next/dynamic'
import { useAuth } from './AuthContext'

const RegisterForm = dynamic(() => import('./RegisterForm'), { ssr: false })
const LoginForm = dynamic(() => import('./LoginForm'), { ssr: false })

export default function AuthCardContent() {
  const { isRegister, setIsRegister } = useAuth()

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <AnimatePresence mode="wait" initial={false}>
        {isRegister ? (
          <motion.div
            key="register"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{ minWidth: 400, p: 3, borderRadius: 4, boxShadow: 6 }}>
              <CardContent>
                <RegisterForm setState={setIsRegister} />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{ minWidth: 400, p: 3, borderRadius: 4, boxShadow: 6 }}>
              <CardContent>
                <LoginForm setState={setIsRegister} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}
