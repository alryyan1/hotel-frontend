import axios, { AxiosError, AxiosResponse } from 'axios'
import { toast } from 'sonner'
import { API_BASE } from '../constansts'

// Define error response structure
interface ErrorResponse {
    message?: string
    errors?: Record<string, string[]>
    error?: string
}

const apiClient = axios.create({
    baseURL: API_BASE,
    headers:{
        'Content-Type': 'application/json',
        Accept: 'application/json',
    }
})

// Request interceptor
apiClient.interceptors.request.use((config)=>{
    const token = localStorage.getItem('token')
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor for centralized error handling
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response
    },
    (error: AxiosError<ErrorResponse>) => {
        const { response, request, message } = error

        // Network error (no response received)
        if (!response) {
            toast.error('Network Error', {
                description: 'Unable to connect to the server. Please check your internet connection.'
            })
            return Promise.reject(error)
        }

        const { status, data } = response
        let errorMessage = 'An unexpected error occurred'
        let errorDescription = ''

        // Handle different HTTP status codes
        switch (status) {
            case 400:
                errorMessage = 'Bad Request'
                errorDescription = data?.message || data?.error || 'Invalid request data'
                break
            
            case 401:
                errorMessage = 'Unauthorized'
                errorDescription = 'Your session has expired. Please log in again.'
                // Clear token and redirect to login
                localStorage.removeItem('token')
                // You can add navigation logic here if needed
                break
            
            case 403:
                errorMessage = 'Forbidden'
                errorDescription = 'You do not have permission to perform this action'
                break
            
            case 404:
                errorMessage = 'Not Found'
                errorDescription = 'The requested resource was not found'
                break
            
            case 422:
                errorMessage = 'Validation Error'
                // Handle Laravel validation errors
                if (data?.errors) {
                    const validationErrors = Object.values(data.errors).flat()
                    errorDescription = validationErrors.join(', ')
                } else {
                    errorDescription = data?.message || data?.error || 'Validation failed'
                }
                break
            
            case 429:
                errorMessage = 'Too Many Requests'
                errorDescription = 'You have made too many requests. Please try again later.'
                break
            
            case 500:
                errorMessage = 'Server Error'
                errorDescription = 'An internal server error occurred. Please try again later.'
                break
            
            case 502:
                errorMessage = 'Bad Gateway'
                errorDescription = 'The server is temporarily unavailable. Please try again later.'
                break
            
            case 503:
                errorMessage = 'Service Unavailable'
                errorDescription = 'The service is temporarily unavailable. Please try again later.'
                break
            
            default:
                errorMessage = `Error ${status}`
                errorDescription = data?.message || data?.error || message || 'An unexpected error occurred'
        }

        // Show error toast
        toast.error(errorMessage, {
            description: errorDescription,
            duration: 5000,
        })

        return Promise.reject(error)
    }
)

export default apiClient