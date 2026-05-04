import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
})

export const authApi = {
  login: (email: string, password: string) => 
    api.post('/api/auth/login', { email, password }).then(r => r.data),
  
  register: (name: string, email: string, password: string) => 
    api.post('/api/auth/register', { name, email, password }).then(r => r.data),
}