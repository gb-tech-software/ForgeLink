#include <jni.h>
#include <string>

extern "C" JNIEXPORT jstring JNICALL
Java_com_forgelink_ForgeLinkNativeModule_executeCommand(JNIEnv* env, jobject thiz, jstring command) {
    const char* input = env->GetStringUTFChars(command, nullptr);
    std::string result = "Native bridge ready: ";
    result += input;
    env->ReleaseStringUTFChars(command, input);
    return env->NewStringUTF(result.c_str());
}
