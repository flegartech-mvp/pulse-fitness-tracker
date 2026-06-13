import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg pt-12">
      <EmptyState
        icon={Compass}
        title="Page not found"
        body="That link doesn't go anywhere. Head back to your dashboard and carry on training."
        action={
          <Link to="/">
            <Button variant="primary">Back to dashboard</Button>
          </Link>
        }
      />
    </div>
  )
}
