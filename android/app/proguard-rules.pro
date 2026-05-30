# Gson rules to preserve reflection and annotations
-keep class com.google.gson.reflect.TypeToken { *; }
-keep class * extends com.google.gson.reflect.TypeToken
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep our API data models from being obfuscated or removed
-keep class com.example.vedicjyotish.data.models.** { *; }

# OkHttp rules
-keepattributes Signature, InnerClasses, AnnotationDefault
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
