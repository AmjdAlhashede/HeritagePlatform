package com.heritage.app.presentation.theme

import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically

// Standard animation durations
object AnimationDurations {
    const val Fast = 200
    const val Normal = 300
    const val Slow = 400
    const val VerySlow = 600
}

// Standard spring specs
object SpringSpecs {
    val Default = spring<Float>(
        dampingRatio = Spring.DampingRatioMediumBouncy,
        stiffness = Spring.StiffnessMedium
    )
    
    val Bouncy = spring<Float>(
        dampingRatio = Spring.DampingRatioLowBouncy,
        stiffness = Spring.StiffnessLow
    )
    
    val Smooth = spring<Float>(
        dampingRatio = Spring.DampingRatioNoBouncy,
        stiffness = Spring.StiffnessMedium
    )
}

// Standard tween specs
object TweenSpecs {
    val Fast = tween<Float>(
        durationMillis = AnimationDurations.Fast,
        easing = FastOutSlowInEasing
    )
    
    val Normal = tween<Float>(
        durationMillis = AnimationDurations.Normal,
        easing = FastOutSlowInEasing
    )
    
    val Slow = tween<Float>(
        durationMillis = AnimationDurations.Slow,
        easing = FastOutSlowInEasing
    )
}

// Common enter/exit transitions
object Transitions {
    val FadeIn = fadeIn(animationSpec = tween(AnimationDurations.Normal))
    val FadeOut = fadeOut(animationSpec = tween(AnimationDurations.Normal))
    
    val SlideInFromBottom = slideInVertically(
        animationSpec = tween(AnimationDurations.Normal),
        initialOffsetY = { it / 2 }
    )
    
    val SlideOutToBottom = slideOutVertically(
        animationSpec = tween(AnimationDurations.Normal),
        targetOffsetY = { it / 2 }
    )
}
