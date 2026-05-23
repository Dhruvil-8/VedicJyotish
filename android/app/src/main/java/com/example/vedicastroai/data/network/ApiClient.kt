package com.example.vedicastroai.data.network

object ApiClient {
    lateinit var service: VedicApiService
    private var isInitialized = false

    fun init(baseUrl: String) {
        if (!isInitialized) {
            service = VedicApiService(baseUrl)
            isInitialized = true
        } else {
            service.baseUrl = baseUrl
        }
    }
}
