cmake_minimum_required(VERSION 3.22.1)
project(ForgeLinkNative LANGUAGES C CXX)

add_library(forcelink-native SHARED
    forge_link.cpp
)

find_library(log-lib log)

target_link_libraries(forcelink-native PRIVATE ${log-lib})
