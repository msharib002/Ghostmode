package com.sharib.ghostmode

import android.Manifest
import android.app.*
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.*
import android.os.*
import android.provider.Settings
import android.graphics.Color
import android.view.*
import android.widget.*
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : Activity() {
    private lateinit var root: LinearLayout
    private val prefs by lazy { getSharedPreferences("ghost", MODE_PRIVATE) }
    private val usage by lazy { getSystemService(USAGE_STATS_SERVICE) as UsageStatsManager }
    private val fmt = SimpleDateFormat("HH:mm", Locale.getDefault())
    private val day = 86_400_000L
    private val bg = Color.rgb(13, 14, 30)
    override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); showHome() }
    override fun onResume() { super.onResume(); if (::root.isInitialized) showHome() }
    private fun allowed(): Boolean {
        val ops = getSystemService(APP_OPS_SERVICE) as AppOpsManager
        return ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), packageName) == AppOpsManager.MODE_ALLOWED
    }
    private fun page(title: String) {
        val scroll = ScrollView(this); scroll.setBackgroundColor(bg)
        root = LinearLayout(this).apply { orientation = 1; setPadding(24, 32, 24, 48) }
        scroll.addView(root); setContentView(scroll)
        label("👻  $title", 27, Color.WHITE)
    }
    private fun label(s: String, size: Int = 17, color: Int = Color.rgb(210, 210, 230)) {
        root.addView(TextView(this).apply { text=s; textSize=size.toFloat(); setTextColor(color); setPadding(0, 12, 0, 12) })
    }
    private fun button(s: String, action: () -> Unit) {
        root.addView(Button(this).apply { text=s; setOnClickListener { action() } })
    }
    private fun showHome() {
        page("Ghost Mode")
        label("Tumhari phone routine ka private mirror. Analysis sirf is phone par hoti hai.")
        if (!allowed()) {
            label("Usage Access off hai. Iske bina app activity analyze nahi kar sakti.")
            button("Usage Access kholo") { startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) }
            return
        }
        val today = totals(System.currentTimeMillis()-day, System.currentTimeMillis())
        val total = today.values.sum()
        label("Aaj ka app usage: ${minutes(total)}", 22, Color.WHITE)
        label("Sabse zyada: ${topName(today) ?: "Abhi data nahi"}")
        val y = totals(System.currentTimeMillis()-2*day, System.currentTimeMillis()-day).values.sum()
        val delta = (total-y)/60000
        label(if (y==0L) "Comparison ke liye kal ka data chahiye." else "Kal se ${if(delta>=0) "+" else ""}$delta min ka farq")
        button("Ghost Timeline") { showTimeline() }
        button("Prediction vs Actual") { showPrediction() }
        button("Mysterious notification bhejo") { notifyGhost() }
        button("Privacy aur data") { showPrivacy() }
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)
            button("Notifications allow karo") { requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 3) }
    }
    private fun totals(from: Long, to: Long): Map<String,Long> {
        return usage.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, from, to).orEmpty()
            .filter { it.packageName != packageName && it.totalTimeInForeground > 0 }
            .groupBy { it.packageName }.mapValues { entry -> entry.value.sumOf { it.totalTimeInForeground } }
    }
    private fun name(pkg: String): String = try { packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg,0)).toString() } catch (_: Exception) { pkg }
    private fun topName(m: Map<String,Long>) = m.maxByOrNull { it.value }?.key?.let(::name)
    private fun minutes(ms: Long) = "${ms/60000} min"
    private fun showTimeline() {
        page("Ghost Timeline")
        button("← Wapas") { showHome() }
        label("Aaj ke foreground events (recent pehle):")
        val end=System.currentTimeMillis(); val events=usage.queryEvents(end-day,end); val event=UsageEvents.Event()
        val rows= mutableListOf<String>()
        while(events.hasNextEvent()) { events.getNextEvent(event)
            if(event.eventType==UsageEvents.Event.ACTIVITY_RESUMED && event.packageName!=packageName)
                rows.add("${fmt.format(Date(event.timeStamp))}   ${name(event.packageName)}")
        }
        if(rows.isEmpty()) label("Events available nahi hain; Usage Access check karo.")
        else rows.takeLast(100).asReversed().forEach { label(it) }
    }
    private fun showPrediction() {
        page("Prediction vs Actual")
        button("← Wapas") { showHome() }
        val now=System.currentTimeMillis(); val hour=Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val calendar=Calendar.getInstance().apply { set(Calendar.HOUR_OF_DAY,hour); set(Calendar.MINUTE,0); set(Calendar.SECOND,0); set(Calendar.MILLISECOND,0) }
        val start=calendar.timeInMillis
        val past=(1..7).mapNotNull { i -> topName(totals(start-i*day,start-i*day+3_600_000L)) }
        val predicted=past.groupingBy { it }.eachCount().maxByOrNull { it.value }?.key
        val actual=topName(totals(start,now))
        label("Isi ghante ke pichhle 7 din dekh kar andaza:")
        label("Prediction: ${predicted ?: "Abhi enough history nahi"}", 22, Color.WHITE)
        label("Aaj iss ghante sabse zyada: ${actual ?: "Abhi koi activity nahi"}", 20)
        label(if(predicted==null || actual==null) "Comparison pending" else if(predicted==actual) "Prediction match hui 👻" else "Routine badli hui lagti hai 👀")
        label("Ye pattern based guess hai, future ki guarantee nahi.")
    }
    private fun showPrivacy() {
        page("Privacy")
        button("← Wapas") { showHome() }
        label("Usage statistics Android se locally read hoti hain. App internet permission nahi maangti. Account, server ya upload nahi hai.")
        label("Ghost Mode apni database mein usage history save nahi karta; Android ki Usage Access settings mein permission band kar sakte ho.")
        button("Usage Access settings") { startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) }
    }
    private fun notifyGhost() {
        if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS),3); return
        }
        val today=totals(System.currentTimeMillis()-day,System.currentTimeMillis())
        val msg=topName(today)?.let { "Aaj tum baar baar $it par lautay ho... 👻" } ?: "Aaj ki routine abhi ek raaz hai... 👻"
        val channel=NotificationChannel("ghost", "Ghost observations", NotificationManager.IMPORTANCE_DEFAULT)
        val manager=getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(channel)
        val notification=Notification.Builder(this,"ghost").setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Ghost Mode").setContentText(msg).setAutoCancel(true).build()
        manager.notify(100,notification)
        Toast.makeText(this,"Notification bhej di",Toast.LENGTH_SHORT).show()
    }
}
