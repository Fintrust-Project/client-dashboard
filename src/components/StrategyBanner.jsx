import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import '../css/StrategyBanner.css'

const StrategyBanner = () => {
    const { user } = useAuth()
    const [companyStrategy, setCompanyStrategy] = useState(null)
    const [teamStrategy, setTeamStrategy] = useState(null)
    const [loading, setLoading] = useState(true)
    const previousStrategiesRef = useRef({ company: null, team: null })

    useEffect(() => {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    useEffect(() => {
        if (user) {
            fetchStrategies()

            // Real-time subscription to updates
            const channel = supabase
                .channel('strategy_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'strategies' }, (payload) => {
                    console.log('Strategy update detected:', payload)
                    fetchStrategies(true) // Pass true to indicate this is from real-time update
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [user])

    const playNotificationSound = () => {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.frequency.value = 800 // Frequency in Hz
            oscillator.type = 'sine'

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.5)
        } catch (error) {
            console.error('Error playing sound:', error)
        }
    }

    const showNotification = (title, message, scope) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: message,
                icon: scope === 'company' ? '🌐' : '👥',
                tag: 'strategy-update',
                requireInteraction: false
            })

            // Auto-close after 10 seconds
            setTimeout(() => notification.close(), 10000)
        }
    }

    const fetchStrategies = async (isRealTimeUpdate = false) => {
        try {
            setLoading(true)

            // Fetch latest company-wide strategy (no date filter for ensuring visibility during testing)
            const { data: company, error: companyError } = await supabase
                .from('strategies')
                .select('*, profiles!author_id(username)')
                .eq('scope', 'company')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (companyError) {
                console.error('Company strategy error:', companyError)
            }

            // Check if this is a new company strategy
            if (isRealTimeUpdate && company && company.id !== previousStrategiesRef.current.company) {
                playNotificationSound()
                showNotification(
                    '🌐 New Company Strategy',
                    company.message,
                    'company'
                )
                previousStrategiesRef.current.company = company.id
            }

            setCompanyStrategy(company)

            // Fetch latest team-specific strategy
            let team = null
            if (user?.manager_id) {
                const { data: teamData, error: teamError } = await supabase
                    .from('strategies')
                    .select('*, profiles!author_id(username)')
                    .eq('scope', 'team')
                    .eq('target_team_id', user.manager_id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (teamError) {
                    console.error('Team strategy error:', teamError)
                }
                team = teamData
            }

            // Check if this is a new team strategy
            if (isRealTimeUpdate && team && team.id !== previousStrategiesRef.current.team) {
                playNotificationSound()
                showNotification(
                    '👥 New Team Strategy',
                    team.message,
                    'team'
                )
                previousStrategiesRef.current.team = team.id
            }

            setTeamStrategy(team)

        } catch (error) {
            console.error('Error fetching strategies:', error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return null

    if (!companyStrategy && !teamStrategy) {
        return (
            <div className="strategy-banner-container strategy-empty">
                <div className="strategy-content">
                    <div className="strategy-icon">💡</div>
                    <div className="strategy-text-area">
                        <h3>Today's Strategy</h3>
                        <p className="strategy-message">No strategy posted yet. Check back soon!</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="strategy-banners-wrapper">
            {companyStrategy && (
                <div className="strategy-banner-container">
                    <div className="strategy-content">
                        <div className="strategy-icon">🌐</div>
                        <div className="strategy-text-area">
                            <div className="strategy-header-row">
                                <h3>Company Strategy from {companyStrategy.profiles?.username || 'Admin'}</h3>
                                <span className="strategy-scope-indicator scope-company">
                                    Company-Wide
                                </span>
                            </div>
                            <p className="strategy-message">"{companyStrategy.message}"</p>
                        </div>
                    </div>
                </div>
            )}

            {teamStrategy && (
                <div className="strategy-banner-container strategy-team">
                    <div className="strategy-content">
                        <div className="strategy-icon">👥</div>
                        <div className="strategy-text-area">
                            <div className="strategy-header-row">
                                <h3>Team Strategy from {teamStrategy.profiles?.username || 'Team Lead'}</h3>
                                <span className="strategy-scope-indicator scope-team">
                                    Your Team
                                </span>
                            </div>
                            <p className="strategy-message">"{teamStrategy.message}"</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StrategyBanner
