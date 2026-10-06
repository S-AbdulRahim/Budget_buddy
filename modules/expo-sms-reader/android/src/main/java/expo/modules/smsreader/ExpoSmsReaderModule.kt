package expo.modules.smsreader

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.util.regex.Pattern

private const val PERMISSIONS_REQUEST_CODE = 8042
private const val PREFERENCES_NAME = "expo.modules.smsreader"
private const val KEY_HAS_REQUESTED_SMS = "has_requested_sms_permissions"

class ExpoSmsReaderModule : Module() {
  private var smsReceiver: BroadcastReceiver? = null
  private var pendingPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoSmsReader")

    Events("onSmsReceived")

    AsyncFunction("checkPermissionsAsync") {
      val context = appContext.reactContext ?: return@AsyncFunction mapOf(
        "readSms" to false,
        "receiveSms" to false,
        "canAskAgain" to true
      )
      val readSms = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.READ_SMS
      ) == PackageManager.PERMISSION_GRANTED

      val receiveSms = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.RECEIVE_SMS
      ) == PackageManager.PERMISSION_GRANTED

      val activity = appContext.currentActivity
      val prefs = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      val hasRequestedBefore = prefs.getBoolean(KEY_HAS_REQUESTED_SMS, false)

      val canAskAgain = if (!readSms || !receiveSms) {
        if (hasRequestedBefore && activity != null) {
          ActivityCompat.shouldShowRequestPermissionRationale(activity, Manifest.permission.READ_SMS) ||
          ActivityCompat.shouldShowRequestPermissionRationale(activity, Manifest.permission.RECEIVE_SMS)
        } else {
          true
        }
      } else {
        true
      }

      mapOf(
        "readSms" to readSms,
        "receiveSms" to receiveSms,
        "canAskAgain" to canAskAgain
      )
    }

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      // Part 1 diagnostic log
      Log.d("ExpoSmsReader", "permissionsManager is null: true")

      val context = appContext.reactContext
      val activity = appContext.currentActivity

      if (context == null || activity == null) {
        Log.w("ExpoSmsReader", "Cannot request permissions: currentActivity or reactContext is null")
        promise.resolve(mapOf(
          "readSms" to false,
          "receiveSms" to false,
          "canAskAgain" to true
        ))
        return@AsyncFunction
      }

      val alreadyReadSms = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.READ_SMS
      ) == PackageManager.PERMISSION_GRANTED

      val alreadyReceiveSms = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.RECEIVE_SMS
      ) == PackageManager.PERMISSION_GRANTED

      if (alreadyReadSms && alreadyReceiveSms) {
        promise.resolve(mapOf(
          "readSms" to true,
          "receiveSms" to true,
          "canAskAgain" to true
        ))
        return@AsyncFunction
      }

      val permissionsArray = arrayOf(
        Manifest.permission.READ_SMS,
        Manifest.permission.RECEIVE_SMS
      )

      val prefs = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      val hasRequestedBefore = prefs.getBoolean(KEY_HAS_REQUESTED_SMS, false)

      val shouldShowRationaleBefore = ActivityCompat.shouldShowRequestPermissionRationale(
        activity,
        Manifest.permission.READ_SMS
      ) || ActivityCompat.shouldShowRequestPermissionRationale(
        activity,
        Manifest.permission.RECEIVE_SMS
      )

      if (hasRequestedBefore && !shouldShowRationaleBefore) {
        Log.d("ExpoSmsReader", "SMS permissions are permanently denied (canAskAgain: false)")
        promise.resolve(mapOf(
          "readSms" to false,
          "receiveSms" to false,
          "canAskAgain" to false
        ))
        return@AsyncFunction
      }

      if (activity is PermissionAwareActivity) {
        pendingPromise = promise
        activity.requestPermissions(
          permissionsArray,
          PERMISSIONS_REQUEST_CODE,
          PermissionListener { requestCode, permissions, grantResults ->
            if (requestCode == PERMISSIONS_REQUEST_CODE) {
              val readIdx = permissions.indexOf(Manifest.permission.READ_SMS)
              val receiveIdx = permissions.indexOf(Manifest.permission.RECEIVE_SMS)

              val readGranted = readIdx != -1 && grantResults.getOrNull(readIdx) == PackageManager.PERMISSION_GRANTED
              val receiveGranted = receiveIdx != -1 && grantResults.getOrNull(receiveIdx) == PackageManager.PERMISSION_GRANTED

              val shouldShowRationaleAfter = ActivityCompat.shouldShowRequestPermissionRationale(
                activity,
                Manifest.permission.READ_SMS
              ) || ActivityCompat.shouldShowRequestPermissionRationale(
                activity,
                Manifest.permission.RECEIVE_SMS
              )

              val canAskAgain = if (!readGranted || !receiveGranted) {
                shouldShowRationaleAfter
              } else {
                true
              }

              prefs.edit().putBoolean(KEY_HAS_REQUESTED_SMS, true).apply()

              pendingPromise?.resolve(mapOf(
                "readSms" to readGranted,
                "receiveSms" to receiveGranted,
                "canAskAgain" to canAskAgain
              ))
              pendingPromise = null
              return@PermissionListener true
            }
            return@PermissionListener false
          }
        )
      } else {
        Log.w("ExpoSmsReader", "Activity is not PermissionAwareActivity; falling back to ActivityCompat")
        ActivityCompat.requestPermissions(activity, permissionsArray, PERMISSIONS_REQUEST_CODE)
        prefs.edit().putBoolean(KEY_HAS_REQUESTED_SMS, true).apply()
        promise.resolve(mapOf(
          "readSms" to false,
          "receiveSms" to false,
          "canAskAgain" to true
        ))
      }
    }

    AsyncFunction("readInbox") { options: Map<String, Any?>? ->
      val context = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, Any>>()

      val hasPermission = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.READ_SMS
      ) == PackageManager.PERMISSION_GRANTED

      if (!hasPermission) {
        return@AsyncFunction emptyList<Map<String, Any>>()
      }

      val sinceTimestamp = (options?.get("sinceTimestamp") as? Number)?.toLong()
      val senderPattern = options?.get("senderPattern") as? String
      val regex = if (!senderPattern.isNullOrEmpty()) {
        try {
          Pattern.compile(senderPattern, Pattern.CASE_INSENSITIVE)
        } catch (_: Exception) {
          null
        }
      } else {
        null
      }

      val selectionClauses = mutableListOf<String>()
      val selectionArgs = mutableListOf<String>()

      if (sinceTimestamp != null && sinceTimestamp > 0) {
        selectionClauses.add("${Telephony.Sms.DATE} >= ?")
        selectionArgs.add(sinceTimestamp.toString())
      }

      val selection = if (selectionClauses.isNotEmpty()) selectionClauses.joinToString(" AND ") else null
      val args = if (selectionArgs.isNotEmpty()) selectionArgs.toTypedArray() else null
      val sortOrder = "${Telephony.Sms.DATE} DESC"

      val resultList = mutableListOf<Map<String, Any>>()

      val cursor = context.contentResolver.query(
        Telephony.Sms.Inbox.CONTENT_URI,
        arrayOf(
          Telephony.Sms._ID,
          Telephony.Sms.ADDRESS,
          Telephony.Sms.BODY,
          Telephony.Sms.DATE
        ),
        selection,
        args,
        sortOrder
      )

      cursor?.use {
        val addressIdx = it.getColumnIndex(Telephony.Sms.ADDRESS)
        val bodyIdx = it.getColumnIndex(Telephony.Sms.BODY)
        val dateIdx = it.getColumnIndex(Telephony.Sms.DATE)

        while (it.moveToNext()) {
          val sender = if (addressIdx != -1) it.getString(addressIdx) ?: "" else ""
          val body = if (bodyIdx != -1) it.getString(bodyIdx) ?: "" else ""
          val timestamp = if (dateIdx != -1) it.getLong(dateIdx) else 0L

          if (regex != null && !regex.matcher(sender).find()) {
            continue
          }

          resultList.add(
            mapOf(
              "sender" to sender,
              "body" to body,
              "timestamp" to timestamp
            )
          )
        }
      }

      resultList
    }

    Function("startWatchingSms") {
      val context = appContext.reactContext ?: return@Function false
      if (smsReceiver != null) return@Function true

      smsReceiver = object : BroadcastReceiver() {
        override fun onReceive(c: Context, intent: Intent) {
          if (intent.action == "android.provider.Telephony.SMS_RECEIVED") {
            val bundle: Bundle? = intent.extras
            if (bundle != null) {
              val pdus = bundle.get("pdus") as? Array<*> ?: return
              val format = bundle.getString("format")
              val messagesBySender = mutableMapOf<String, StringBuilder>()
              var lastTimestamp = System.currentTimeMillis()

              for (pdu in pdus) {
                val byteArr = pdu as? ByteArray ?: continue
                val message = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                  SmsMessage.createFromPdu(byteArr, format)
                } else {
                  @Suppress("DEPRECATION")
                  SmsMessage.createFromPdu(byteArr)
                }
                val sender = message.displayOriginatingAddress ?: ""
                val bodyPart = message.displayMessageBody ?: ""
                lastTimestamp = message.timestampMillis

                if (!messagesBySender.containsKey(sender)) {
                  messagesBySender[sender] = StringBuilder()
                }
                messagesBySender[sender]?.append(bodyPart)
              }

              for ((sender, bodyBuilder) in messagesBySender) {
                this@ExpoSmsReaderModule.sendEvent(
                  "onSmsReceived",
                  mapOf(
                    "sender" to sender,
                    "body" to bodyBuilder.toString(),
                    "timestamp" to lastTimestamp
                  )
                )
              }
            }
          }
        }
      }

      val filter = IntentFilter("android.provider.Telephony.SMS_RECEIVED")
      if (Build.VERSION.SDK_INT >= 34) {
        context.registerReceiver(smsReceiver, filter, Context.RECEIVER_EXPORTED)
      } else {
        context.registerReceiver(smsReceiver, filter)
      }
      true
    }

    Function("stopWatchingSms") {
      val context = appContext.reactContext ?: return@Function false
      smsReceiver?.let {
        try {
          context.unregisterReceiver(it)
        } catch (_: Exception) {}
        smsReceiver = null
      }
      true
    }

    OnDestroy {
      pendingPromise = null
      val context = appContext.reactContext ?: return@OnDestroy
      smsReceiver?.let {
        try {
          context.unregisterReceiver(it)
        } catch (_: Exception) {}
        smsReceiver = null
      }
    }
  }
}
