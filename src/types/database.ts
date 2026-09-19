export type AdminDoctorStat = {
  id: string
  full_name: string
  crm: string | null
  crm_uf: string | null
  patient_count: number
}

export type AdminDashboardStats = {
  doctors_count: number
  patients_count: number
  doctors: AdminDoctorStat[]
}

export type AdminDonationSupporter = {
  id: string
  full_name: string
  product_id: string | null
  monthly_brl: number
  status: string
  updated_at: string | null
}

export type AdminDonationSegment = {
  active_count: number
  monthly_brl: number
  supporters: AdminDonationSupporter[]
}

export type AdminDonationStats = {
  total: {
    active_count: number
    monthly_brl: number
  }
  doctors: AdminDonationSegment
  patients: AdminDonationSegment
}
