package com.fanshanng.aichatpocket

import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.OpenableColumns
import android.view.DragEvent

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)
    installDragReceiver()
    handleSharedImageIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    handleSharedImageIntent(intent)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }

  private fun installDragReceiver() {
    window.decorView.setOnDragListener { _, event ->
      when (event.action) {
        DragEvent.ACTION_DRAG_STARTED -> true
        DragEvent.ACTION_DROP -> {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            requestDragAndDropPermissions(event)
          }
          val images = extractImagesFromClipData(event.clipData)
          if (images.isNotEmpty()) {
            publishSharedImages(images)
          }
          images.isNotEmpty()
        }
        else -> true
      }
    }
  }

  private fun handleSharedImageIntent(intent: Intent?) {
    val images = extractSharedImages(intent)
    if (images.isEmpty()) {
      return
    }

    publishSharedImages(images)
  }

  private fun publishSharedImages(images: List<SharedImageItem>) {
    SharedImageModule.appendPendingImages(images)
    SharedImageModule.emitImages(reactHost?.currentReactContext, images)
  }

  private fun extractSharedImages(intent: Intent?): List<SharedImageItem> {
    if (intent == null || !intent.type.orEmpty().startsWith("image/")) {
      return emptyList()
    }

    val images = linkedMapOf<String, SharedImageItem>()
    when (intent.action) {
      Intent.ACTION_SEND -> {
        intent.readParcelableExtraCompat<Uri>(Intent.EXTRA_STREAM)?.let { addImage(images, it) }
      }
      Intent.ACTION_SEND_MULTIPLE -> {
        intent.readParcelableArrayListExtraCompat<Uri>(Intent.EXTRA_STREAM)?.forEach { uri ->
          addImage(images, uri)
        }
      }
    }

    extractImagesFromClipData(intent.clipData).forEach { images[it.uri] = it }
    return images.values.toList()
  }

  private fun extractImagesFromClipData(clipData: android.content.ClipData?): List<SharedImageItem> {
    if (clipData == null) {
      return emptyList()
    }

    val images = linkedMapOf<String, SharedImageItem>()
    for (index in 0 until clipData.itemCount) {
      clipData.getItemAt(index).uri?.let { addImage(images, it) }
    }
    return images.values.toList()
  }

  private fun addImage(images: MutableMap<String, SharedImageItem>, uri: Uri) {
    val mimeType = contentResolver.getType(uri)
    if (mimeType == null || mimeType.startsWith("image/")) {
      val uriString = uri.toString()
      images[uriString] = SharedImageItem(
        uri = uriString,
        name = queryDisplayName(uri),
        mimeType = mimeType
      )
    }
  }

  private fun queryDisplayName(uri: Uri): String? {
    var cursor: Cursor? = null
    return try {
      cursor = contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
      if (cursor != null && cursor.moveToFirst()) {
        cursor.getString(cursor.getColumnIndexOrThrow(OpenableColumns.DISPLAY_NAME))
      } else {
        uri.lastPathSegment
      }
    } catch (_: Exception) {
      uri.lastPathSegment
    } finally {
      cursor?.close()
    }
  }

  private inline fun <reified T : android.os.Parcelable> Intent.readParcelableExtraCompat(name: String): T? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      getParcelableExtra(name, T::class.java)
    } else {
      @Suppress("DEPRECATION")
      getParcelableExtra(name)
    }
  }

  private inline fun <reified T : android.os.Parcelable> Intent.readParcelableArrayListExtraCompat(name: String): ArrayList<T>? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      getParcelableArrayListExtra(name, T::class.java)
    } else {
      @Suppress("DEPRECATION")
      getParcelableArrayListExtra(name)
    }
  }
}
