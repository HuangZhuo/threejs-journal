uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.0);

    // calc dayMix
    // vec3 sunDirection = vec3(0.0, 0.0, 1.0);
    float sunOrientation = dot(uSunDirection, normal);
    float dayMix = smoothstep(-0.25, 0.5, sunOrientation);

    // use dayMix to mix texture color
    vec3 dayColor = texture(uDayTexture, vUv).rgb;
    vec3 TwilightColor = texture(uNightTexture, vUv).rgb;
    color = mix(TwilightColor, dayColor, dayMix);

    // specular & clouds
    vec2 specularCloudsColor = texture(uSpecularCloudsTexture,vUv).rg;
    // color = vec3(specularCloudsColor, 0);
    float cloudsMix = smoothstep(0.5, 1.0, specularCloudsColor.g); // 通过 smoothstep 获得更少的云
    cloudsMix *= dayMix; // 夜晚不需要云，挡住了灯光（trick）

    color = mix(color, vec3(1.0), cloudsMix);

    // Fresnel 类似边缘光的效果
    float fresnel = dot(viewDirection, normal) + 1.0;
    fresnel = pow(fresnel, 2.0);

    // Atmosphere 大气层效果 辉光
    // 在日光直射的范围显示淡蓝色，在明暗交界的地方显示橙色
    float atmosphereDayMix = smoothstep(-0.5, 1.0, sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
    color = mix(color, atmosphereColor, fresnel * atmosphereDayMix);

    // Specular 镜面光
    vec3 reflection = reflect(-uSunDirection, normal);
    float specular = dot(reflection, -viewDirection);
    specular = max(specular, 0.0);
    specular = pow(specular, 32.0);
    specular *= specularCloudsColor.r; // 剔除大陆区域

    vec3 specularColor = mix(vec3(1.0), atmosphereColor, fresnel);
    color += specular * specularColor;

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}