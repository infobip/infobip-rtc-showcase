package com.infobip.rtc.showcase.service

import java.util.*
import retrofit2.Call
import retrofit2.http.POST
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object TokenService {

    private const val TOKEN_API_BASE_URL = "http://10.0.2.2:8080/"

    private val accessTokenService = Retrofit.Builder()
        .baseUrl(TOKEN_API_BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(AccessTokenService::class.java)

    private var accessToken = obtainToken()

    fun getAccessToken(): AccessToken {
        if (expired()) {
            accessToken = obtainToken()
        }
        return accessToken
    }

    private fun obtainToken(): AccessToken {
        return accessTokenService.generate().execute().body()!!
    }

    private fun expired(): Boolean {
        return Date().after(accessToken.expirationTime)
    }
}

data class AccessToken (
    val token: String,
    val identity: String,
    val expirationTime: Date
)

interface AccessTokenService {
    @POST("token")
    fun generate(): Call<AccessToken>
}