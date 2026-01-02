import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import './CompactStrategy.css'

const StrategyBanner = () => {
    const { user } = useAuth()
    const [companyStrategy, setCompanyStrategy] = useState(null)
    const [teamStrategy, setTeamStrategy] = useState(null)
    const [loading, setLoading] = useState(true)
    const previousStrategiesRef = useRef({ company: null, team: null })

    useEffect(() => {
        if (user) {
            fetchStrategies()

            const channel = supabase
                .channel('strategy_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'strategies' }, (payload) => {
                    fetchStrategies(true)
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [user])

    const fetchStrategies = async (isRealTimeUpdate = false) => {
        try {
            setLoading(true)

            // Fetch latest company-wide strategy
            const { data: company } = await supabase
                .from('strategies')
                .select('*, profiles!author_id(username)')
                .eq('scope', 'company')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            setCompanyStrategy(company)

            // Fetch latest team-specific strategy
            if (user?.manager_id) {
                const { data: team } = await supabase
                    .from('strategies')
                    .select('*, profiles!author_id(username)')
                    .eq('scope', 'team')
                    .eq('target_team_id', user.manager_id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                setTeamStrategy(team)
            }
        } catch (error) {
            console.error('Error fetching strategies:', error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading && !companyStrategy && !teamStrategy) return null

    const activeStrategy = teamStrategy || companyStrategy

    if (!activeStrategy) return null

    return (
        <div className="compact-strategy">
            <div className="strategy-indicator">
                <span className={`scope-dot ${activeStrategy.scope}`}></span>
                <span className="strategy-label">
                    {activeStrategy.scope === 'team' ? 'TEAM' : 'COMPANY'} STRATEGY
                </span>
            </div>
            <div className="strategy-msg-container">
                <p className="strategy-msg-text" title={activeStrategy.message}>
                    {activeStrategy.message}
                </p>
                <span className="strategy-author">
                    — {activeStrategy.profiles?.username || 'Admin'}
                </span>
            </div>
        </div>
    )
}

export default StrategyBanner
