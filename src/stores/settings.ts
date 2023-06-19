import axios from 'axios'
import { defineStore } from 'pinia'

//define interface to store data from backend properly
interface Setting {
    color: string;
    logo: string;
    price: number;
}

export const settingsStore = defineStore('settings',{
    state: () =>{
        return{
            settings: [] as Setting[]
        }
    },

    getters: {
        getSettings(state){
            return state.settings
          }
      },

    actions: {
        async fetchSettings() {
            try{ 
                const data = await axios.get<Setting[]>('http://localhost:3000/api/settings/')
                this.settings = data.data
                console.log(this.settings)
                console.log('Settings fetched from database')
            }
            catch (error) {
                alert(error);
                console.log(error);
            }
        }
    }
}

)