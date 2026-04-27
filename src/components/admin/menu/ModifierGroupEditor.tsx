'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ModifierGroup, ModifierOption, ModifierGroupWithOptions, Product } from '@/types/database'
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Loader2, Check, X, Settings2, Puzzle, ArrowUpDown, ToggleLeft, ToggleRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format-currency'

interface ModifierGroupEditorProps {
  product: Product
  shopId: string
  onClose: () => void
}

export function ModifierGroupEditor({ product, shopId, onClose }: ModifierGroupEditorProps) {
  const supabase = createClient()
  const [groups, setGroups] = useState<ModifierGroupWithOptions[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null)

  // New group form
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    is_required: false,
    min_selections: 0,
    max_selections: 1,
  })

  // New option form per group
  const [newOptionForms, setNewOptionForms] = useState<Record<string, { name: string; price_delta: string }>>({})

  useEffect(() => {
    fetchGroups()
  }, [product.id])

  async function fetchGroups() {
    setLoading(true)
    const { data: groupData } = await supabase
      .from('modifier_groups')
      .select('*, modifier_options(*)')
      .eq('product_id', product.id)
      .order('sort_order')

    if (groupData) {
      const groupsRaw = groupData as any[]
      const parsed: ModifierGroupWithOptions[] = groupsRaw.map(g => ({
        ...g,
        modifier_options: (g.modifier_options || []).sort((a: ModifierOption, b: ModifierOption) => a.sort_order - b.sort_order)
      }))
      setGroups(parsed)
    }
    setLoading(false)
  }

  async function handleSaveNewGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!newGroupForm.name.trim()) return
    setSavingGroupId('new')

    const { data } = await (supabase as any)
      .from('modifier_groups')
      .insert({
        shop_id: shopId,
        product_id: product.id,
        name: newGroupForm.name.trim(),
        is_required: newGroupForm.is_required,
        min_selections: newGroupForm.is_required ? 1 : 0,
        max_selections: newGroupForm.max_selections,
        sort_order: groups.length,
      })
      .select('*, modifier_options(*)')
      .single()

    if (data) {
      const group = data as any
      setGroups(prev => [...prev, { ...group, modifier_options: [] }])
      setNewGroupForm({ name: '', is_required: false, min_selections: 0, max_selections: 1 })
      setShowNewGroup(false)
      setExpandedGroupId(data.id)
    }
    setSavingGroupId(null)
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm('Modifier-Gruppe wirklich löschen?')) return
    await (supabase as any).from('modifier_groups').delete().eq('id', groupId)
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }

  async function handleToggleRequired(group: ModifierGroupWithOptions) {
    const newRequired = !group.is_required
    const { error } = await (supabase as any)
      .from('modifier_groups')
      .update({ is_required: newRequired, min_selections: newRequired ? 1 : 0 })
      .eq('id', group.id)

    if (!error) {
      setGroups(prev => prev.map(g =>
        g.id === group.id ? { ...g, is_required: newRequired, min_selections: newRequired ? 1 : 0 } : g
      ))
    }
  }

  async function handleUpdateMaxSelections(group: ModifierGroupWithOptions, max: number) {
    const { error } = await (supabase as any)
      .from('modifier_groups')
      .update({ max_selections: max })
      .eq('id', group.id)

    if (!error) {
      setGroups(prev => prev.map(g =>
        g.id === group.id ? { ...g, max_selections: max } : g
      ))
    }
  }

  async function handleAddOption(groupId: string) {
    const form = newOptionForms[groupId]
    if (!form?.name?.trim()) return
    setSavingGroupId(groupId)

    const group = groups.find(g => g.id === groupId)
    const { data } = await (supabase as any)
      .from('modifier_options')
      .insert({
        group_id: groupId,
        name: form.name.trim(),
        price_delta: parseFloat(form.price_delta) || 0,
        sort_order: group?.modifier_options.length || 0,
      })
      .select()
      .single()

    if (data) {
      const option = data as ModifierOption
      setGroups(prev => prev.map(g =>
        g.id === groupId
          ? { ...g, modifier_options: [...g.modifier_options, option] }
          : g
      ))
      setNewOptionForms(prev => ({ ...prev, [groupId]: { name: '', price_delta: '' } }))
    }
    setSavingGroupId(null)
  }

  async function handleDeleteOption(groupId: string, optionId: string) {
    if (!confirm('Option wirklich löschen?')) return
    await (supabase as any).from('modifier_options').delete().eq('id', optionId)
    setGroups(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, modifier_options: g.modifier_options.filter(o => o.id !== optionId) }
        : g
    ))
  }

  async function handleToggleDefault(groupId: string, option: ModifierOption) {
    const newDefault = !option.is_default
    
    // If setting to default, unset others in group
    if (newDefault) {
      await (supabase as any)
        .from('modifier_options')
        .update({ is_default: false })
        .eq('group_id', groupId)
    }

    const { error } = await (supabase as any)
      .from('modifier_options')
      .update({ is_default: newDefault })
      .eq('id', option.id)

    if (!error) {
      setGroups(prev => prev.map(g =>
        g.id === groupId
          ? { ...g, modifier_options: g.modifier_options.map(o => o.id === option.id ? { ...o, is_default: newDefault } : (newDefault ? { ...o, is_default: false } : o)) }
          : g
      ))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-outline-variant/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Puzzle className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Modifier-Editor</span>
          </div>
          <h3 className="font-black text-base tracking-tight">{product.name}</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Auswahlgruppen &amp; Optionen konfigurieren</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
          <X className="w-4 h-4 text-on-surface-variant" />
        </button>
      </div>

      {/* Groups list */}
      <div className="space-y-3">
        {groups.length === 0 && !showNewGroup && (
          <div className="text-center py-8 rounded-2xl border-2 border-dashed border-outline-variant/20">
            <Puzzle className="w-8 h-8 text-on-surface-variant/20 mx-auto mb-3" />
            <p className="text-sm text-on-surface-variant font-medium">Noch keine Modifier-Gruppen</p>
            <p className="text-xs text-on-surface-variant/60 mt-1">z.B. „Wähle eine Sauce", „Extra Zutaten"</p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.id} className="border border-outline-variant/10 rounded-2xl overflow-hidden bg-white">
            {/* Group Header */}
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${group.is_required ? 'bg-error animate-pulse' : 'bg-outline-variant'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm">{group.name}</span>
                    {group.is_required && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-error/10 text-error">
                        Pflichtfeld
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-on-surface-variant/50">
                      {group.modifier_options.length} Option{group.modifier_options.length !== 1 ? 'en' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Max. {group.max_selections === 1 ? '1 Auswahl' : `${group.max_selections} Auswahlen`}
                  </p>
                </div>
                {expandedGroupId === group.id
                  ? <ChevronUp className="w-4 h-4 text-on-surface-variant/50 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-on-surface-variant/50 shrink-0" />
                }
              </button>
              <button
                onClick={() => handleDeleteGroup(group.id)}
                className="p-2 text-on-surface-variant/40 hover:text-error hover:bg-error/5 rounded-full transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Expanded Content */}
            {expandedGroupId === group.id && (
              <div className="px-4 pb-4 space-y-4 border-t border-outline-variant/5 pt-4 bg-surface-container-lowest">
                {/* Settings Row */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleToggleRequired(group)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      group.is_required
                        ? 'bg-error/10 text-error'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {group.is_required
                      ? <ToggleRight className="w-4 h-4" />
                      : <ToggleLeft className="w-4 h-4" />
                    }
                    {group.is_required ? 'Pflichtauswahl' : 'Optional'}
                  </button>

                  <div className="flex items-center gap-2 bg-surface-container-low rounded-full px-4 py-2">
                    <ArrowUpDown className="w-3 h-3 text-on-surface-variant/50" />
                    <span className="text-xs font-bold text-on-surface-variant">Max:</span>
                    <select
                      value={group.max_selections}
                      onChange={e => handleUpdateMaxSelections(group, parseInt(e.target.value))}
                      className="text-xs font-black bg-transparent border-none outline-none text-on-surface"
                    >
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  {group.modifier_options.map(option => (
                    <div key={option.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-container-low">
                      <button
                        onClick={() => handleToggleDefault(group.id, option)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          option.is_default
                            ? 'border-primary bg-primary'
                            : 'border-outline-variant/40'
                        }`}
                      >
                        {option.is_default && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className="flex-1 text-sm font-semibold">{option.name}</span>
                      <span className={`text-xs font-black ${option.price_delta > 0 ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                        {option.price_delta > 0 ? `+${formatCurrency(option.price_delta)}` : 'inkl.'}
                      </span>
                      <button
                        onClick={() => handleDeleteOption(group.id, option.id)}
                        className="p-1.5 text-on-surface-variant/30 hover:text-error hover:bg-error/5 rounded-full transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Option Form */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Option Name..."
                      value={newOptionForms[group.id]?.name || ''}
                      onChange={e => setNewOptionForms(prev => ({
                        ...prev,
                        [group.id]: { ...prev[group.id], name: e.target.value }
                      }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddOption(group.id)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-outline-variant/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/30"
                    />
                    <div className="flex items-center">
                      <span className="text-sm text-on-surface-variant/50 font-bold mx-1">+</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        step="0.10"
                        min="0"
                        value={newOptionForms[group.id]?.price_delta || ''}
                        onChange={e => setNewOptionForms(prev => ({
                          ...prev,
                          [group.id]: { ...prev[group.id], price_delta: e.target.value }
                        }))}
                        className="w-20 px-3 py-2.5 rounded-xl bg-white border border-outline-variant/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
                      />
                      <span className="text-sm text-on-surface-variant/50 font-bold ml-1">€</span>
                    </div>
                    <button
                      onClick={() => handleAddOption(group.id)}
                      disabled={savingGroupId === group.id}
                      className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 shrink-0"
                    >
                      {savingGroupId === group.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Plus className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* New Group Form */}
        {showNewGroup && (
          <form
            onSubmit={handleSaveNewGroup}
            className="border-2 border-primary/20 rounded-2xl p-4 space-y-3 bg-primary/2"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Neue Gruppe</p>
            <input
              type="text"
              autoFocus
              required
              placeholder="z.B. Wähle eine Sauce"
              value={newGroupForm.name}
              onChange={e => setNewGroupForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white border border-outline-variant/15 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setNewGroupForm(prev => ({ ...prev, is_required: !prev.is_required }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  newGroupForm.is_required
                    ? 'bg-error/10 text-error'
                    : 'bg-surface-container-low text-on-surface-variant'
                }`}
              >
                {newGroupForm.is_required
                  ? <ToggleRight className="w-4 h-4" />
                  : <ToggleLeft className="w-4 h-4" />
                }
                {newGroupForm.is_required ? 'Pflichtauswahl' : 'Optional'}
              </button>

              <div className="flex items-center gap-2 bg-surface-container-low rounded-full px-4 py-2">
                <span className="text-xs font-bold text-on-surface-variant">Max. Auswahl:</span>
                <select
                  value={newGroupForm.max_selections}
                  onChange={e => setNewGroupForm(prev => ({ ...prev, max_selections: parseInt(e.target.value) }))}
                  className="text-xs font-black bg-transparent border-none outline-none text-on-surface"
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingGroupId === 'new'}
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {savingGroupId === 'new' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Gruppe Speichern'}
              </button>
              <button
                type="button"
                onClick={() => setShowNewGroup(false)}
                className="px-4 py-3 rounded-xl bg-surface-container-low text-on-surface-variant text-xs font-black uppercase tracking-widest hover:bg-surface-container-high transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Add Group Button */}
      {!showNewGroup && (
        <button
          onClick={() => setShowNewGroup(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-outline-variant/20 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:border-primary/30 hover:text-primary hover:bg-primary/2 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neue Auswahlgruppe
        </button>
      )}
    </div>
  )
}
