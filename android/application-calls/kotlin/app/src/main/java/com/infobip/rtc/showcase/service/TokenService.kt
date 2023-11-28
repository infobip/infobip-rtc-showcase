package com.infobip.rtc.showcase.service

import retrofit2.Call
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.POST
import retrofit2.http.Path
import java.util.*

enum class Role {
    CUSTOMER,
    AGENT
}

object TokenService {
    private const val TOKEN_API_BASE_URL = "http://10.0.2.2:8080/"

    private val accessTokenService = Retrofit.Builder()
        .baseUrl(TOKEN_API_BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(AccessTokenService::class.java)

    private var accessToken: AccessToken? = null
    private var role: Role? = null

    fun getCustomerAccessToken(): AccessToken {
        if (expired() || role == null || role == Role.AGENT) {
            accessToken = obtainToken(null)
            role = Role.CUSTOMER
        }
        return accessToken!!
    }

    fun getAgentAccessToken(): AccessToken {
        if (expired() || role == null || role == Role.CUSTOMER) {
            accessToken = obtainToken(identity = "agent")
            role = Role.AGENT
        }
        return accessToken!!
    }

    fun getRole(): Role? {
        return role
    }

    private fun obtainToken(identity: String?): AccessToken {
        if (identity == null) {
            return accessTokenService.generate().execute().body()!!
        }
        return accessTokenService.generateFixedIdentity(identity).execute().body()!!
    }

    private fun expired(): Boolean {
        return accessToken == null || Date().after(accessToken!!.expirationTime)
    }
}

data class AccessToken(
    val token: String,
    val identity: String,
    val expirationTime: Date
)

interface AccessTokenService {
    @POST("token")
    fun generate(): Call<AccessToken>

    @POST("token/{identity}")
    fun generateFixedIdentity(@Path("identity") identity: String): Call<AccessToken>
}