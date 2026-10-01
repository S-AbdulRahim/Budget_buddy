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
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.interfaces.permissions.PermissionsStatus
import java.util.regex.Pattern

class ExpoSmsReaderModule : Module() {
  private var smsReceiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoSmsReader")

    Events("onSmsReceived")

    AsyncFunction("checkPermissionsAsync") {
      val context = appContext.reactContext ?: return@AsyncFunction mapOf(
        "readSms" to false,
        "receiveSms" to false
      )
      val readSms = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.READ_SMS
      ) == PackageManager.PERMISSION_GRANTED

      val receiveSms = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.RECEIVE_SMS
      ) == PackageManager.PERMISSION_GRANTED

      mapOf(
        "readSms" to readSms,
        "receiveSms" to receiveSms
      )
    }

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      val permissionsManager = appContext.permissionsManager
      if (permissionsManager == null) {
        val context = appContext.reactContext
        val readSms = context != null && ContextCompat.checkSelfPermission(
          context,
          Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED
        val receiveSms = context != null && ContextCompat.checkSelfPermission(
          context,
          Manifest.permission.RECEIVE_SMS
        ) == PackageManager.PERMISSION_GRANTED

        promise.resolve(mapOf(
          "readSms" to readSms,
          "receiveSms" to receiveSms
        ))
        return@AsyncFunction
      }

      permissionsManager.requestPermissions(
        { response ->
          val readSms = response[Manifest.permission.READ_SMS]?.status == PermissionsStatus.GRANTED
          val receiveSms = response[Manifest.permission.RECEIVE_SMS]?.status == PermissionsStatus.GRANTED

          promise.resolve(mapOf(
            "readSms" to readSms,
            "receiveSms" to receiveSms
          ))
        },
        Manifest.permission.READ_SMS,
        Manifest.permission.RECEIVE_SMS
      )
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
