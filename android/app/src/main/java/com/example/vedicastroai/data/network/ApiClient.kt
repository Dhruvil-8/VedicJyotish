package com.example.vedicastroai.data.network

object ApiClient {
    lateinit var service: VedicApiService
    private var isInitialized = false

    // To protect your public Hugging Face space API quota, define your secret key here:
    // (e.g. "my_astro_secret_key"). If left empty, no key validation header will be sent.
    private const val API_SECRET_KEY: String = ""

    fun init(baseUrl: String) {
        if (!isInitialized) {
            service = VedicApiService(baseUrl, API_SECRET_KEY.ifEmpty { null })
            isInitialized = true
        } else {
            service.baseUrl = baseUrl
        }
    }
}
