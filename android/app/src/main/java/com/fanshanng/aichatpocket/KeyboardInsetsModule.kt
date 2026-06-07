package com.fanshanng.aichatpocket

import android.app.Activity
import android.graphics.Rect
import android.view.View
import android.view.WindowManager
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.PixelUtil
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

class KeyboardInsetsModule(private val appContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(appContext) {

  private var attachedActivity: Activity? = null
  private var attachedView: View? = null
  private var imeAnimationRunning = false
  private var lastBottom = -1
  private var lastScreenY = -1
  private var lastVisible = false

  override fun getName(): String = NAME

  @ReactMethod
  fun start() {
    val activity = reactApplicationContext.currentActivity ?: return
    activity.runOnUiThread {
      attachToActivity(activity)
    }
  }

  @ReactMethod
  fun stop() {
    val activity = reactApplicationContext.currentActivity ?: return
    activity.runOnUiThread {
      detach()
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required by NativeEventEmitter.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required by NativeEventEmitter.
  }

  private fun attachToActivity(activity: Activity) {
    val rootView = activity.window.decorView.findViewById<View>(android.R.id.content) ?: activity.window.decorView
    if (attachedView === rootView) {
      emitFromInsets(rootView, ViewCompat.getRootWindowInsets(rootView))
      return
    }

    detach()
    attachedActivity = activity
    attachedView = rootView
    val callback = object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_CONTINUE_ON_SUBTREE) {
      override fun onPrepare(animation: WindowInsetsAnimationCompat) {
        if (animation.typeMask and WindowInsetsCompat.Type.ime() != 0) {
          imeAnimationRunning = true
        }
      }

      override fun onProgress(
        insets: WindowInsetsCompat,
        runningAnimations: MutableList<WindowInsetsAnimationCompat>
      ): WindowInsetsCompat {
        if (runningAnimations.any { it.typeMask and WindowInsetsCompat.Type.ime() != 0 }) {
          emitFromInsets(rootView, insets)
        }
        return insets
      }

      override fun onEnd(animation: WindowInsetsAnimationCompat) {
        if (animation.typeMask and WindowInsetsCompat.Type.ime() != 0) {
          imeAnimationRunning = false
          emitFromInsets(rootView, ViewCompat.getRootWindowInsets(rootView))
        }
      }
    }
    ViewCompat.setOnApplyWindowInsetsListener(rootView) { _, insets ->
      if (!imeAnimationRunning) {
        emitFromInsets(rootView, insets)
      }
      insets
    }
    ViewCompat.setWindowInsetsAnimationCallback(rootView, callback)
    ViewCompat.requestApplyInsets(rootView)
    emitFromInsets(rootView, ViewCompat.getRootWindowInsets(rootView))
  }

  private fun detach() {
    attachedView?.let { view ->
      ViewCompat.setWindowInsetsAnimationCallback(view, null)
    }
    attachedActivity = null
    attachedView = null
    imeAnimationRunning = false
    lastBottom = -1
    lastScreenY = -1
    lastVisible = false
  }

  private fun emitFromInsets(view: View, insets: WindowInsetsCompat?) {
    val visibleFrame = Rect()
    view.rootView.getWindowVisibleDisplayFrame(visibleFrame)
    val location = IntArray(2)
    view.rootView.getLocationInWindow(location)
    val rootHeight = if (view.rootView.height > 0) view.rootView.height else view.height
    val rootBottom = location[1] + rootHeight
    val visibleTop = max(0, visibleFrame.top)
    val visibleBottom = if (visibleFrame.bottom > 0) visibleFrame.bottom else rootBottom

    if (insets == null) {
      val screenY = PixelUtil.toDIPFromPixel(max(0, visibleBottom - visibleTop).toFloat()).roundToInt()
      emit(0, screenY, false)
      return
    }

    val imeBottom = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
    val systemInsets = insets.getInsets(WindowInsetsCompat.Type.systemBars())
    val keyboardHeight = max(0, imeBottom - systemInsets.bottom)
    val isVisible = insets.isVisible(WindowInsetsCompat.Type.ime()) && keyboardHeight > 0
    val bottom = if (isVisible) PixelUtil.toDIPFromPixel(keyboardHeight.toFloat()).roundToInt() else 0
    val adjustMode =
      attachedActivity?.window?.attributes?.softInputMode?.and(WindowManager.LayoutParams.SOFT_INPUT_MASK_ADJUST)
    val keyboardTop =
      if (!isVisible) {
        rootBottom
      } else {
        val insetsTop = rootBottom - keyboardHeight
        if (adjustMode == WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING) {
          insetsTop
        } else {
          min(visibleBottom, insetsTop)
        }
      }
    val screenY = PixelUtil.toDIPFromPixel(max(0, keyboardTop - visibleTop).toFloat()).roundToInt()
    emit(bottom, screenY, isVisible)
  }

  private fun emit(bottom: Int, screenY: Int, visible: Boolean) {
    if (bottom == lastBottom && screenY == lastScreenY && visible == lastVisible) {
      return
    }

    lastBottom = bottom
    lastScreenY = screenY
    lastVisible = visible
    val event = Arguments.createMap()
    event.putDouble("bottom", bottom.toDouble())
    event.putDouble("screenY", screenY.toDouble())
    event.putBoolean("visible", visible)
    appContext
      .getJSModule(ReactContext.RCTDeviceEventEmitter::class.java)
      .emit(EVENT_KEYBOARD_INSETS, event)
  }

  companion object {
    private const val NAME = "KeyboardInsets"
    private const val EVENT_KEYBOARD_INSETS = "KeyboardInsetsChanged"
  }
}
