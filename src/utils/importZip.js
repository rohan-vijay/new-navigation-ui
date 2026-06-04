import JSZip from 'jszip'

const langOf = (name) => {
  if (/\.md$/i.test(name)) return 'markdown'
  if (/\.py$/i.test(name)) return 'python'
  if (/\.json$/i.test(name)) return 'json'
  return 'text'
}

// Parse an uploaded skill .zip into { name, files } where files matches the
// SkillCreate tree shape: [{ name, type:'file', lang, content } | { name, type:'folder', children:[...] }]
export async function parseSkillZip(file) {
  const zip = await JSZip.loadAsync(file)

  // collect all non-directory entries
  const entries = []
  zip.forEach((path, entry) => { if (!entry.dir) entries.push({ path, entry }) })
  if (entries.length === 0) throw new Error('The zip is empty.')

  // strip a single common top-level folder if present (e.g. "deal-risk-analyzer/")
  const segs = entries.map(e => e.path.split('/'))
  let topFolder = null
  if (segs.every(s => s.length > 1)) {
    const first = segs[0][0]
    if (segs.every(s => s[0] === first)) topFolder = first
  }

  // read contents + build a nested map (one level of folders, like the editor)
  const root = []
  const folderMap = {}
  const skipNames = /^(__MACOSX|\.DS_Store)/

  for (const { path, entry } of entries) {
    let rel = path
    if (topFolder) rel = rel.slice(topFolder.length + 1)
    if (!rel || skipNames.test(rel)) continue
    const parts = rel.split('/').filter(Boolean)
    const fileName = parts[parts.length - 1]
    if (skipNames.test(fileName)) continue
    const content = await entry.async('string')
    const fileNode = { name: fileName, type: 'file', lang: langOf(fileName), content }

    if (parts.length === 1) {
      root.push(fileNode)
    } else {
      const folderName = parts[0]
      if (!folderMap[folderName]) {
        folderMap[folderName] = { name: folderName, type: 'folder', children: [] }
        root.push(folderMap[folderName])
      }
      folderMap[folderName].children.push(fileNode)
    }
  }

  // derive a skill name: SKILL.md H1 → top folder → file name
  let name = topFolder ? topFolder.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Imported skill'
  const skillMd = root.find(f => f.type === 'file' && /^skill\.md$/i.test(f.name))
  if (skillMd) {
    const h1 = skillMd.content.split('\n').find(l => /^#\s+/.test(l))
    if (h1) name = h1.replace(/^#\s+/, '').trim()
  }

  // order: SKILL.md first, then folders, then other files
  root.sort((a, b) => {
    const rank = (n) => /^skill\.md$/i.test(n.name) ? 0 : n.type === 'folder' ? 1 : 2
    return rank(a) - rank(b)
  })

  return { name, files: root }
}
