import React, { useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { supabase } from '../supabase'
import '../css/ImportClients.css'

const ImportClients = ({ onClose, onImportComplete }) => {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [allData, setAllData] = useState([])
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({ total: 0, saved: 0, skipped: 0 })

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setError('')
    setSuccess('')
    setProgress(0)

    const fileExtension = uploadedFile.name.split('.').pop().toLowerCase()

    if (fileExtension === 'csv') {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError('Error parsing CSV: ' + results.errors[0].message)
            return
          }
          processParsedData(results.data)
        }
      })
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          processParsedData(jsonData)
        } catch (error) {
          setError('Error reading Excel: ' + error.message)
        }
      }
      reader.readAsArrayBuffer(uploadedFile)
    } else {
      setError('Unsupported format. Please use Excel or CSV.')
    }
  }

  const processParsedData = (data) => {
    const normalized = data.map(row => {
      const normalizedRow = {}
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim()
        if (lowerKey.includes('name')) normalizedRow.name = row[key]
        else if (lowerKey.includes('mobile') || lowerKey.includes('phone') || lowerKey.includes('number')) normalizedRow.mobile = String(row[key] || '').trim()
        else if (lowerKey.includes('email') || lowerKey.includes('gmail')) normalizedRow.email = row[key]
      })
      return normalizedRow
    }).filter(r => r.name && r.mobile)

    setAllData(normalized)
    setStats({ total: normalized.length, saved: 0, skipped: 0 })
    if (normalized.length === 0) setError('No valid client records found in file.')
  }

  const runStreamImport = async () => {
    if (allData.length === 0) return

    setIsImporting(true)
    setError('')
    setSuccess('')

    const batchSize = 50
    let currentSaved = 0
    let currentSkipped = 0

    try {
      for (let i = 0; i < allData.length; i += batchSize) {
        const batch = allData.slice(i, i + batchSize)

        for (const row of batch) {
          const { data: existing, error: checkErr } = await supabase
            .from('clients')
            .select('id')
            .eq('mobile', row.mobile)
            .maybeSingle()

          if (!checkErr && !existing) {
            const { error: insErr } = await supabase
              .from('clients')
              .insert([{
                name: row.name,
                mobile: row.mobile,
                email: row.email || null,
                is_assigned: false
              }])

            if (!insErr) currentSaved++
          } else {
            currentSkipped++
          }
        }

        const currentProgress = Math.min(Math.round(((i + batch.length) / allData.length) * 100), 100)
        setProgress(currentProgress)
        setStats({ total: allData.length, saved: currentSaved, skipped: currentSkipped })
      }

      setSuccess(`✅ Done! ${currentSaved} added, ${currentSkipped} skipped.`)
      setTimeout(() => {
        onImportComplete()
        onClose()
      }, 3000)
    } catch (err) {
      setError('Import interrupted: ' + err.message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="import-modal high-volume" onClick={(e) => e.stopPropagation()}>
        <div className="import-header">
          <h2>High-Volume Master Import</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="import-content">
          <div className="import-top-section">
            <div className={`file-drop-zone ${file ? 'active' : ''}`}>
              <input type="file" id="f-stream-btn" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} style={{ display: 'none' }} />
              <label htmlFor="f-stream-btn">
                {file ? `📄 ${file.name}` : '📎 Select Excel or CSV File'}
              </label>
            </div>

            <button
              className="import-now-button"
              onClick={runStreamImport}
              disabled={isImporting || allData.length === 0}
            >
              {isImporting ? '⚡ Importing...' : `🚀 Import ${allData.length} Clients`}
            </button>
          </div>

          {isImporting && (
            <div className="stream-progress-bar">
              <div className="bar-outer">
                <div className="bar-inner" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="bar-labels">
                <span>{progress}% Finished</span>
                <span>{stats.saved} Saved | {stats.skipped} Skipped</span>
              </div>
            </div>
          )}

          {success && <div className="status-msg success-msg">{success}</div>}
          {error && <div className="status-msg error-msg">{error}</div>}

          {!isImporting && allData.length > 0 && (
            <div className="preview-container-mini">
              <h4>Previewing {allData.length > 5 ? 'Top 5' : allData.length} records:</h4>
              <table className="mini-table">
                <thead><tr><th>Name</th><th>Mobile</th><th>Email</th></tr></thead>
                <tbody>{allData.slice(0, 5).map((r, i) => <tr key={i}><td>{r.name}</td><td>{r.mobile}</td><td>{r.email || '-'}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportClients
