import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-margin-mobile lg:px-margin-desktop py-24">
      <SignIn />
    </div>
  )
}
