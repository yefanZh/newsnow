import { getCacheTable } from "../database/cache"

export default defineEventHandler(async (event) => {
  try {
    const cache = await getCacheTable()
    if (!cache) {
      return {
        success: false,
        error: "Cache not enabled",
        data: [],
      }
    }

    // 获取所有缓存的新闻源
    const db = useDatabase()
    const rows = await db.prepare("SELECT id, data, updated FROM cache").all() as any
    
    const results = (rows.results ?? rows) as Array<{ id: string; data: string; updated: number }>
    
    if (!results?.length) {
      return {
        success: true,
        data: [],
        message: "No news cached yet",
      }
    }

    // 解析所有新闻并合并
    const allNews = results.flatMap(row => {
      try {
        const items = JSON.parse(row.data)
        return items.map((item: any) => ({
          ...item,
          source: row.id,
          updated: row.updated,
        }))
      } catch {
        return []
      }
    })

    // 按更新时间排序
    allNews.sort((a, b) => (b.updated || 0) - (a.updated || 0))

    return {
      success: true,
      data: allNews,
      total: allNews.length,
      sources: results.map(r => r.id),
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      data: [],
    }
  }
})
