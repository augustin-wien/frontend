import agent from '@/api/agent'
import { defineStore } from 'pinia'
import { getVendor, fetchVendors, postVendors, patchVendor, removeVendor, checkVendorId } from '@/api/api'
import router from '@/router'

export const useVendorStore = defineStore('vendor', {
  state: () => {
    return {
      vendorid: "",
      vendorName: ""
    }
  },
  actions: {
    async checkID(vendorId: string | string[]) {
      agent.Vendor.checkID(vendorId).then((response) => {
        this.vendorName = response.FirstName
        this.vendorid = typeof vendorId == "string"? vendorId : vendorId[0]
        if (this.vendorName !== "") {
          router.push(`/v/${vendorId}/landing-page`)
        }
      }).catch(() => {
        router.push({ name: "Home" })
      })
    }
  }
})
//define interface to store data from backend properly
export interface Vendor {
  Email: string
  FirstName: string
  ID: number
  KeycloakID: string
  LastName: string
  LastPayout: {
    infinityModifier: number
    time: string
    valid: true
  } | null
  LicenseID: string
  UrlID: string
  Balance: number
  IsDisabled: boolean
  Longitude: number
  Latitude: number
  Address: string
}

export interface VendorCheckResponse {
  name: string
}

export const vendorsStore = defineStore('vendors', {
  state: () => {
    return {
      vendors: [] as Vendor[],
      vendorsImportedCount: Number
    }
  },

  getters: {
    getvendors(state: any) {
      return state.vendors
    }
  },

  actions: {
    async getVendors() {
      try {
        const data = await fetchVendors()
        //@ts-ignore
        this.vendors = data.data
        //@ts-ignore
      } catch (error) {
        console.log(error)
      }
    },

    async createVendor(newVendor: Vendor) {
      postVendors(newVendor)
        .then(() => {
          this.getVendors()
        })
        .catch((error) => {
          console.log('Error creating vendor:', error)
        })
    },
    async createVendorPromise(newVendor: Vendor) {
      return postVendors(newVendor)
    },

    async createVendors(vendors: Array<Vendor>) {
      for (let i = 0; i < vendors.length; i++) {
        if (vendors[i] !== null) {
          if (vendors[i].LicenseID === '' || vendors[i].LicenseID === null || vendors[i].LicenseID === undefined) {
            return null
          }
          this.vendorsImportedCount = (i + 1)
          const vendorCheck = await checkVendorId(vendors[i].LicenseID)
          if (vendorCheck === null) {
            await this.createVendorPromise(vendors[i])
          }

        };
      }
    },

    async updateVendor(updatedVendor: Vendor) {
      patchVendor(updatedVendor)
        .then(() => {
          this.getVendors()
        })
        .catch((error) => {
          console.log('Error updating vendor:', error)
        })
    },
    async deleteVendor(vendorId: number) {
      removeVendor(vendorId)
        .then(() => {
          this.getVendors()
        })
        .catch((error) => {
          console.log('Error deleting vendor:', error)
        })
    },
    async getVendor(vendorId: number) {
      try {
        const data = await getVendor(vendorId)
        return data.data
      } catch (error) {
        console.log(error)
      }
    }

  }
})
