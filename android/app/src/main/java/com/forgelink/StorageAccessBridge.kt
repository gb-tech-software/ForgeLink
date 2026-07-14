package com.forgelink

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
import androidx.documentfile.provider.DocumentFile
import java.io.File

class StorageAccessBridge(private val context: Context) {
    
    companion object {
        const val REQUEST_CODE_OPEN_DIRECTORY = 42
        const val REQUEST_CODE_CREATE_FILE = 43
    }

    fun requestDirectoryAccess(activity: Activity) {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        }
        activity.startActivityForResult(intent, REQUEST_CODE_OPEN_DIRECTORY)
    }

    fun persistPermission(treeUri: Uri) {
        val takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
        context.contentResolver.takePersistableUriPermission(treeUri, takeFlags)
    }

    fun listProjectsInDirectory(treeUri: Uri): List<ProjectInfo> {
        val documentFile = DocumentFile.fromTreeUri(context, treeUri) ?: return emptyList()
        val projects = mutableListOf<ProjectInfo>()

        documentFile.listFiles().forEach { file ->
            if (file.isDirectory) {
                val hasPackageJson = file.findFile("package.json") != null
                val hasIndexHtml = file.findFile("index.html") != null
                val hasPythonFile = file.listFiles().any { it.name?.endsWith(".py") == true }
                val hasGitDir = file.findFile(".git") != null

                if (hasPackageJson || hasIndexHtml || hasPythonFile || hasGitDir) {
                    projects.add(
                        ProjectInfo(
                            name = file.name ?: "Unknown",
                            uri = file.uri,
                            type = detectProjectType(file),
                            path = file.uri.toString()
                        )
                    )
                }
            }
        }

        return projects
    }

    private fun detectProjectType(dir: DocumentFile): String {
        return when {
            dir.findFile("package.json") != null && dir.findFile("next.config.js") != null -> "next"
            dir.findFile("package.json") != null && dir.findFile("vite.config.js") != null -> "vite"
            dir.findFile("package.json") != null -> "node"
            dir.findFile("index.html") != null -> "html"
            dir.listFiles().any { it.name?.endsWith(".py") == true } -> "python"
            else -> "unknown"
        }
    }

    fun readFile(fileUri: Uri): String? {
        return try {
            context.contentResolver.openInputStream(fileUri)?.bufferedReader()?.use { it.readText() }
        } catch (e: Exception) {
            null
        }
    }

    fun writeFile(fileUri: Uri, content: String): Boolean {
        return try {
            context.contentResolver.openOutputStream(fileUri)?.bufferedWriter()?.use { writer ->
                writer.write(content)
                writer.flush()
                true
            } ?: false
        } catch (e: Exception) {
            false
        }
    }

    data class ProjectInfo(
        val name: String,
        val uri: Uri,
        val type: String,
        val path: String
    )
}
