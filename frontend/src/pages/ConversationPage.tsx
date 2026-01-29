import { ConversationFlow } from '../components/ConversationFlow'
import { CrisisAlert } from '../components/CrisisAlert'

export const ConversationPage = () => {
  return (
    <div className="min-h-screen">
      <CrisisAlert />
      <ConversationFlow />
    </div>
  )
}

