import { GlobalTemplateManager } from '@/components/admin/super-admin/GlobalTemplateManager'

export default function GlobalTemplatesPage() {
  return (
    <div className="p-8 sm:p-12 min-h-screen bg-[#F8F9FA]">
      <div className="max-w-[1400px] mx-auto">
        <GlobalTemplateManager />
      </div>
    </div>
  )
}
