import { defineStore } from 'pinia'
import type { VivaWalletResponse } from '@/models/responseVivaWallet'
import type { VivaWalletVerification } from '@/models/verificationVivaWallet'
import router from '@/router'
import agent from '@/api/agent'

export interface orderItem {
  item: number
  quantity: number
}

export const usePaymentStore = defineStore('payment', {
  state: () => {
    const email = localStorage.getItem('email')

    return {
      //Payment service (0: Stripe, 1: vivawallet)
      paymentservice: 1,

      agbChecked: false,
      testamount: 1,
      pricePerPaper: 300,
      digital: { digital: true },
      //the unit for price is cents (smallest unit)
      sum: 0,
      price: 300,
      //the unit for tip is euros
      tipItem: 2,

      //vivawallet
      response: [] as VivaWalletResponse[],
      transactionID: '',
      verification: {} as VivaWalletVerification | null,
      timeStamp: '',
      firstName: '',
      url: '',
      failedCount: 0,
      email: email ? email : ''
    }
  },
  actions: {
    setSum(sum: number) {
      this.sum = sum
    },
    epaper() {
      this.digital.digital = true
    },

    print() {
      this.digital.digital = false
    },
    addN(n: number) {
      this.testamount++
      this.price = this.price + this.pricePerPaper * n
    },

    //AGB
    checkAgb() {
      if (this.agbChecked) {
        router.push({ name: 'Payment' })
        return true
      }

      return false
    },
    setPrice(price: number) {
      this.price = price
    },
    setPricePerPaper(price: number) {
      this.pricePerPaper = price
    },
    toAGB() {
      window.open(import.meta.env.VITE_AGB_URL, '_blank')
    },
    resetVerification() {
      this.failedCount = 0
      this.verification = null
    },
    setEmail(email: string) {
      this.email = email
      localStorage.setItem('email', email)
    },

    //vivawallet methodes
    async postOrder(
      items: Array<orderItem>,
      quantity: number,
      vendorLicenseID: string,
      customerEmail: string
    ) {
      this.response[0] = await agent.VivaWallet.postOrder(items, vendorLicenseID, customerEmail)
      this.url = this.response[0].SmartCheckoutURL
      window.location.href = this.url
    },
    async verifyPayment() {
      // dont reverify an already verified order
      if (this.verification != null) {
        return true
      }

      if (this.transactionID === '') {
        // eslint-disable-next-line no-console
        console.log('id undefined')
      } else {
        try {
          this.verification = await agent.VivaWallet.verifyPayment(this.transactionID)
          this.timeStamp = this.verification.TimeStamp
          this.firstName = this.verification.FirstName
        } catch (_error) {
          this.failedCount++

          // eslint-disable-next-line no-console
          console.log('failed to verify payment', _error)

          if (this.failedCount > 5) {
            router.push('/failure')
          }

          return false
        }
      }

      if (this.timeStamp != '') {
        router.push('/paymentconfirmation')
      } else {
        this.failedCount++

        if (this.failedCount > 5) {
          router.push('/failure')
        }

        return false
      }
    }
  }
})
