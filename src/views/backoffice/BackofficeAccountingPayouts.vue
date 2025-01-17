<script lang="ts" setup>
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { ref, computed, watch, onMounted } from 'vue'
import { usePaymentsStore } from '@/stores/payments'
import { useKeycloakStore } from '@/stores/keycloak'
import { useItemsStore } from '@/stores/items'
import { type Payment } from '@/stores/payments'
import { exportAsCsv, formatCredit } from '@/utils/utils'
import { useSettingsStore } from '@/stores/settings'

const startOfDay = (date: Date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const yesterday = startOfDay(new Date(new Date().setDate(new Date().getDate() - 2)))
const tomorrow = startOfDay(new Date(new Date().setDate(new Date().getDate() + 1)))
const startDate = ref<Date>(yesterday)
const endDate = ref(tomorrow)
const date = ref([startDate.value, endDate.value])
const paymentStore = usePaymentsStore()
const keycloakStore = useKeycloakStore()
const itemsStore = useItemsStore()
const settingsStore = useSettingsStore()

//fetch paymentlist data once component is mounted

const onRangeStart = (value: any) => {
  startDate.value = value // Update the startDate variable
  paymentStore.getPayouts(startDate.value, endDate.value)
}

const onRangeEnd = (value: any) => {
  endDate.value = value // Update the endDate variable
  paymentStore.getPayouts(startDate.value, endDate.value)
}

const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleDateString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const payments = computed(() => paymentStore.payments)

const translateSender = (receiver: string) => {
  return receiver == 'Orga' ? settingsStore.settings.NewspaperName : receiver
}

const authenticated = computed(() => keycloakStore.authenticated)
const items = computed(() => itemsStore.itemsBackoffice)

onMounted(() => {
  if (authenticated.value) {
    paymentStore.getPayouts(startDate.value, endDate.value)
    itemsStore.getItemsBackoffice()
  } else {
    watch(authenticated, () => {
      paymentStore.getPayouts(startDate.value, endDate.value)
      itemsStore.getItemsBackoffice()
    })
  }
})

const sumItemsForOrder = (payment: any, itemID: number) => {
  let sum = 0

  payment.IsPayoutFor?.forEach((payout: Payment) => {
    if (payout.Item === itemID) {
      if (payout.Receiver === payment.Sender) {
        sum += payout.Amount
      } else {
        sum -= payout.Amount
      }
    }
  })

  return sum
}

const exportTable = () => {
  if (!payments.value || payments.value.length == 0) {
    alert('Nothing to export')
    return
  }

  const itemNames = items.value.map((item) => item.Name)

  const header = ['Datum', 'Sender', 'Empfänger', ...itemNames, 'Gesamt']

  const data = payments.value.map((payment: Payment) => {
    const itemAmounts = items.value.map((item) => sumItemsForOrder(payment, item.ID))
    return [
      formatTime(payment.Timestamp),
      translateSender(payment.SenderName),
      payment.AuthorizedBy,
      ...itemAmounts,
      formatCredit(payment.Amount)
    ]
  })

  exportAsCsv(
    [header, ...data],
    `payouts_${startDate.value.toLocaleDateString()}-${endDate.value.toLocaleDateString()}`
  )
}
</script>

<template>
  <component :is="$route.meta.layout || 'div'">
    <template #header>
      <div class="flex space-between justify-between content-center items-center mt-3">
        <h1 className="font-bold text-2xl">{{ $t('protocol') }}</h1>
        <div>
          <VueDatePicker
            v-model="date"
            range
            :enable-time-picker="false"
            :placeholder="$t('chooseDateRange')"
            class="max-w-md"
            @range-start="onRangeStart"
            @range-end="onRangeEnd"
          />
        </div>
        <button class="py-2 px-4 rounded-full customcolor ml-2 h-[44px] mr-6" @click="exportTable">
          {{ $t('export') }}
        </button>
      </div>
    </template>

    <template #main>
      <div class="main">
        <div class="w-full mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="text-xl space-y-3 space-x-3">
            <table className="table-auto border-spacing-4 border-collapse">
              <thead>
                <tr>
                  <th className="p-3">{{ $t('date') }}</th>
                  <th className="p-3">{{ $t('to') }}</th>
                  <th className="p-3">{{ $t('from') }}</th>
                  <th v-for="item in items" :key="`th_${item.ID}`" className="p-3">
                    {{ $t(item.Name) }}
                  </th>
                  <th className="p-3">{{ $t('total') }}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr v-for="(payment, id) in payments" :key="id">
                  <td className="border-t-2 p-3">{{ formatTime(payment.Timestamp) }}</td>
                  <td className="border-t-2 p-3">
                    {{ translateSender(payment.SenderName) }}
                  </td>
                  <td className="border-t-2 p-3">{{ payment.AuthorizedBy }}</td>
                  <td
                    v-for="item in items"
                    :key="`td_${payment.ID}_${item.ID}`"
                    className="border-t-2 p-3"
                  >
                    {{ formatCredit(sumItemsForOrder(payment, item.ID)) }} €
                  </td>
                  <td class="border-t-2 p-3">{{ formatCredit(payment.Amount) }} €</td>
                </tr>
                <tr v-if="payments && payments.length > 0">
                  <td class="border-t-2 p-3"></td>
                  <td class="border-t-2 p-3"></td>
                  <td class="border-t-2 p-3"></td>
                  <td v-for="item in items" :key="`td_total_${item.ID}`" class="border-t-2 p-3">
                    {{
                      formatCredit(
                        payments.reduce(
                          (acc, payment) => acc + sumItemsForOrder(payment, item.ID),
                          0
                        )
                      )
                    }}
                    €
                  </td>
                  <td class="border-t-2 p-3">
                    {{ formatCredit(payments.reduce((acc, payment) => acc + payment.Amount, 0)) }} €
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </component>
</template>
