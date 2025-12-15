import axios, { AxiosError, AxiosResponse } from 'axios'
import { toast } from 'sonner'

// Define error response structure
interface ErrorResponse {
    message?: string
    errors?: Record<string, string[]>
    error?: string
}

// Get the base URL - matching the structure from constansts.ts
const host = '192.168.100.174'
const schema = 'http'
const projectFolder = 'hotel-backend'

// Public API base URL - Laravel routes in api.php are prefixed with /api
// So /api/public routes will be accessible at /api/public/...
const PUBLIC_API_BASE = `${schema}://${host}/${projectFolder}/api/public`

// Public API client without authentication
const publicApiClient = axios.create({
    baseURL: PUBLIC_API_BASE,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    }
})

// Response interceptor for centralized error handling
publicApiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response
    },
    async (error: AxiosError<ErrorResponse | Blob>) => {
        const { response, request, message, config } = error

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

        // If response is a blob (like Excel export), handle it differently
        if (config?.responseType === 'blob' && data instanceof Blob) {
            // Try to parse error message from blob
            try {
                const errorText = await (data as Blob).text()
                const errorData = JSON.parse(errorText)
                errorMessage = 'Export Error'
                errorDescription = errorData?.message || errorData?.error || 'Failed to export file'
            } catch {
                // If parsing fails, use generic error
                errorMessage = 'Export Error'
                errorDescription = 'Failed to export file'
            }
            
            toast.error(errorMessage, {
                description: errorDescription,
                duration: 5000,
            })
            return Promise.reject(error)
        }

        // Handle different HTTP status codes for JSON responses
        switch (status) {
            case 400:
                errorMessage = 'Bad Request'
                errorDescription = (data as ErrorResponse)?.message || (data as ErrorResponse)?.error || 'Invalid request data'
                break
            
            case 401:
                errorMessage = 'Unauthorized'
                errorDescription = 'Your request was not authorized.'
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
                if ((data as ErrorResponse)?.errors) {
                    const validationErrors = Object.values((data as ErrorResponse).errors!).flat()
                    errorDescription = validationErrors.join(', ')
                } else {
                    errorDescription = (data as ErrorResponse)?.message || (data as ErrorResponse)?.error || 'Validation failed'
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
                errorDescription = (data as ErrorResponse)?.message || (data as ErrorResponse)?.error || message || 'An unexpected error occurred'
        }

        // Show error toast
        toast.error(errorMessage, {
            description: errorDescription,
            duration: 5000,
        })

        return Promise.reject(error)
    }
)

export default publicApiClient
