import { defineStore } from 'pinia'
import { fetchSettings, patchSettings } from '@/api/api'

//define interface to store data from backend properly
export interface Settings {
  Color: string
  FontColor: string
  ID: number
  Logo: string
  MainItem: number
  MainItemDescription: string
  MainItemImage: string
  MainItemName: string
  MainItemPrice: number
  MaxOrderAmount: number
  OrgaCoversTransactionCosts: boolean
}

export const settingsStore = defineStore('settings', {
  state: () => {
    return {
      settings: {} as Settings,
      imgUrl: ""
    }
  },

  getters: {
    getSettings(state) {
      return state.settings
    }
  },

  actions: {
    async getSettingsFromApi() {
      try {
        const data = await fetchSettings()
        this.settings = data.data
        this.imgUrl = import.meta.env.VITE_API_URL + this.settings.Logo
      } catch (error) {
        console.log(error)
      }
    },

    async updateSettings(updatedSettings: Settings) {
      try {
        await patchSettings(updatedSettings)
        await this.getSettingsFromApi()
      } catch (error) {
        console.log('Error updating settings:', error)
      }
    }
  }
})
