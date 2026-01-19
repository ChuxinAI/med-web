import { useMemo } from 'react'
import chinaAreaData from '../data/china-area-data.json'
import { normalizeRegionName } from '../lib/region'

type RegionNode = {
  name: string
  cities: { name: string; districts: string[] }[]
}

type ChinaAreaData = Record<string, Record<string, string>>

const REGION_TREE: RegionNode[] = (() => {
  const data = chinaAreaData as ChinaAreaData
  const provinces = data['86'] ?? {}
  const municipalitySet = new Set(['北京市', '天津市', '上海市', '重庆市'])
  const compareByPinyin = (a: string, b: string) =>
    normalizeRegionName(a).localeCompare(normalizeRegionName(b), 'zh-Hans-CN-u-co-pinyin', { numeric: true })
  const specialRank = (name: string) => {
    if (name.includes('自治区')) return 1
    if (['香港特别行政区', '澳门特别行政区', '台湾省'].includes(name)) return 2
    return 0
  }
  const compareProvince = (a: string, b: string) => {
    const aRank = specialRank(a)
    const bRank = specialRank(b)
    if (aRank !== bRank) return aRank - bRank
    return compareByPinyin(a, b)
  }

  return Object.entries(provinces)
    .map(([provinceCode, provinceName]) => {
    const citiesMap = data[provinceCode] ?? {}
    if (municipalitySet.has(provinceName)) {
      const districts = Object.keys(citiesMap)
        .flatMap((cityCode) => Object.values(data[cityCode] ?? {}))
        .filter(Boolean)
        .sort(compareByPinyin)
      return { name: provinceName, cities: [{ name: provinceName, districts }] }
    }

    const cities = Object.entries(citiesMap)
      .map(([cityCode, cityName]) => {
      const districtsMap = data[cityCode] ?? {}
      return { name: cityName, districts: Object.values(districtsMap).sort(compareByPinyin) }
    })
      .sort((a, b) => compareByPinyin(a.name, b.name))
    return { name: provinceName, cities }
  })
    .sort((a, b) => compareProvince(a.name, b.name))
})()

function splitRegion(value?: string) {
  if (!value) return { province: '', city: '', district: '' }
  const [province = '', city = '', district = ''] = value.split('/')
  return { province, city, district }
}

function joinRegion(province: string, city: string, district: string) {
  if (!province) return ''
  if (!city) return province
  if (!district) return `${province}/${city}`
  return `${province}/${city}/${district}`
}

type RegionSelectProps = {
  value?: string
  onChange: (value: string) => void
  className?: string
}

export function RegionSelect({ value, onChange, className }: RegionSelectProps) {
  const { province, city, district } = useMemo(() => splitRegion(value), [value])

  const cityOptions = useMemo(() => {
    const matched = REGION_TREE.find((item) => item.name === province)
    return matched?.cities ?? []
  }, [province])

  const districtOptions = useMemo(() => {
    const matched = cityOptions.find((item) => item.name === city)
    return matched?.districts ?? []
  }, [city, cityOptions])

  const handleProvinceChange = (nextProvince: string) => {
    onChange(joinRegion(nextProvince, '', ''))
  }

  const handleCityChange = (nextCity: string) => {
    onChange(joinRegion(province, nextCity, ''))
  }

  const handleDistrictChange = (nextDistrict: string) => {
    onChange(joinRegion(province, city, nextDistrict))
  }

  return (
    <div className={`grid grid-cols-1 gap-2 sm:grid-cols-3 ${className ?? ''}`.trim()}>
      <select
        value={province}
        onChange={(e) => handleProvinceChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
      >
        <option value="">---</option>
        {REGION_TREE.map((item) => (
          <option key={item.name} value={item.name}>
            {normalizeRegionName(item.name)}
          </option>
        ))}
      </select>
      <select
        value={city}
        onChange={(e) => handleCityChange(e.target.value)}
        disabled={!province}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
      >
        <option value="">---</option>
        {cityOptions.map((item) => (
          <option key={item.name} value={item.name}>
            {normalizeRegionName(item.name)}
          </option>
        ))}
      </select>
      <select
        value={district}
        onChange={(e) => handleDistrictChange(e.target.value)}
        disabled={!city}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
      >
        <option value="">---</option>
        {districtOptions.map((item) => (
          <option key={item} value={item}>
            {normalizeRegionName(item)}
          </option>
        ))}
      </select>
    </div>
  )
}
