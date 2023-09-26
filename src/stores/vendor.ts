import agent from '@/api/agent'
import { defineStore } from 'pinia'

export const useVendorStore = defineStore('vendor', {
  state: () => {
    return {
      vendorid: "",
      vendorName: ""
    }
  },
  actions: {
    async checkID(vendorId: string | string[]) {
      const response = await agent.Vendor.checkID(vendorId)
      console.log(response.FirstName)
      this.vendorName = response.FirstName
      if(this.vendorName !== ""){
        
      }
    }
  }
})
