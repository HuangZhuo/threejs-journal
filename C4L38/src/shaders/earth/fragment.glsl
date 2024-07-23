uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;
uniform vec3 uSunDirection;

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
    float dayMix = dot(uSunDirection, normal);
    dayMix = smoothstep(-0.25, 0.5, dayMix);

    // use dayMix to mix texture color
    vec3 dayColor = texture(uDayTexture, vUv).rgb;
    vec3 nightColor = texture(uNightTexture, vUv).rgb;
    color = mix(nightColor, dayColor, dayMix);

    // specular & clouds
    vec2 specularCloudsColor = texture(uSpecularCloudsTexture,vUv).rg;
    // color = vec3(specularCloudsColor, 0);
    float cloudsMix = smoothstep(0.5, 1.0, specularCloudsColor.g); // 通过 smoothstep 获得更少的云
    cloudsMix *= dayMix; // 夜晚不需要云，挡住了灯光（trick）

    color = mix(color, vec3(1.0), cloudsMix);

    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}