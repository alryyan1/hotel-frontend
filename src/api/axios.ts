import axios from 'axios'
import { API_BASE } from '../constansts'
const apiClient = axios.create({
    baseURL: API_BASE,
    headers:{
        'Content-Type': 'application/json',
        Accept: 'application/json',
    }
})

apiClient.interceptors.request.use((config)=>{
    const token = localStorage.getItem('token')
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default apiClient