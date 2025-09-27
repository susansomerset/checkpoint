import { MinimalClientTest } from '@/components/MinimalClientTest'

export default function ProbePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Hydration Probe</h1>
      <p className="mb-4">This is a server component that renders a client component below:</p>
      <MinimalClientTest />
    </div>
  )
}
